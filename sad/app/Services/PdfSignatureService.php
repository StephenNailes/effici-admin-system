<?php

namespace App\Services;

use setasign\Fpdi\Fpdi;
use App\Models\ActivityPlanSignature;
use App\Models\BudgetRequestSignature;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PdfSignatureService
{
    /**
     * Overlay signatures onto a PDF for either an activity plan or a budget request.
     * Supports roles: moderator, academic_coordinator, dean, vp_finance
     *
     * @param string $sourcePdfPath Path to the source PDF file (stored on public disk)
     * @param int    $requestId     The activity plan ID or budget request ID
     * @param string $type          'activity_plan' | 'budget_request' (default: activity_plan)
     * @return string|null          Path to the signed PDF or null on failure
     */
    public function overlaySignatures(string $sourcePdfPath, int $requestId, string $type = 'activity_plan'): ?string
    {
        try {
            // Fetch signatures based on request type
            if ($type === 'budget_request') {
                $signatures = BudgetRequestSignature::where('budget_request_id', $requestId)->get();
            } else {
                $signatures = ActivityPlanSignature::where('activity_plan_id', $requestId)->get();
            }
            
            if ($signatures->isEmpty()) {
                return $sourcePdfPath; // No signatures to add
            }

            // Check if FPDI is available (enhanced version of FPDF for importing PDFs)
            if (!class_exists('\setasign\Fpdi\Fpdi')) {
                Log::warning('FPDI class not found. Install setasign/fpdi for PDF overlay support.');
                return $sourcePdfPath;
            }

            $pdf = new Fpdi();

            // Resolve paths on the public disk to match where PDFs are stored
            $disk = Storage::disk('public');

            // Normalize to always stamp on the ORIGINAL (non-signed) PDF to avoid duplicate overlays
            $baseSourcePath = $sourcePdfPath;
            if (preg_match('/^(.*)_signed\.(pdf)$/i', $sourcePdfPath, $m)) {
                $tryOriginal = $m[1] . '.' . $m[2];
                if ($disk->exists($tryOriginal)) {
                    $baseSourcePath = $tryOriginal; // use original if available
                }
            }

            if (!$disk->exists($baseSourcePath)) {
                Log::error("Source PDF not found on public disk: {$baseSourcePath} (from: {$sourcePdfPath})");
                return null;
            }
            $fullSourcePath = $disk->path($baseSourcePath);

            // Get page count
            $pageCount = $pdf->setSourceFile($fullSourcePath);
            
            // Import all pages using the template's real size for perfect coordinate mapping
            for ($pageNo = 1; $pageNo <= $pageCount; $pageNo++) {
                $templateId = $pdf->importPage($pageNo);
                $size = $pdf->getTemplateSize($templateId);
                // Ensure the page matches the template dimensions/orientation
                $pdf->AddPage($size['orientation'], [$size['width'], $size['height']]);
                $pdf->useTemplate($templateId, 0, 0);

                // Add signatures on the LAST page (where approval signatures typically are)
                if ($pageNo === $pageCount) {
                    Log::info("Adding approval signatures to final page", [
                        'page_number' => $pageNo,
                        'total_pages' => $pageCount,
                        'signature_count' => count($signatures),
                        'roles' => method_exists($signatures, 'pluck') ? $signatures->pluck('role')->toArray() : []
                    ]);
                    foreach ($signatures as $signature) {
                        $this->addSignatureToPage($pdf, $signature, $size['width'], $size['height']);
                    }
                } else {
                    Log::info("Skipping signature placement on page {$pageNo}, will add to final page ({$pageCount})");
                }
            }
            
            // Save the signed PDF
            $signedPdfPath = $this->generateSignedPdfPath($sourcePdfPath);
            $fullSignedPath = $disk->path($signedPdfPath);
            
            // Ensure directory exists
            $directory = dirname($fullSignedPath);
            if (!is_dir($directory)) {
                mkdir($directory, 0755, true);
            }
            
            $pdf->Output('F', $fullSignedPath);
            
            return $signedPdfPath;
            
        } catch (\Exception $e) {
            Log::error('Error overlaying signatures on PDF: ' . $e->getMessage());
            return null;
        }
    }
    
    /**
     * Add a signature image to the current PDF page
     */
    protected function addSignatureToPage(Fpdi $pdf, $signature, float $pageWidthMm, float $pageHeightMm): void
    {
        try {
            // Decode base64 image
            $imageData = $signature->signature_data;
            
            // Remove data URL prefix if present
            if (strpos($imageData, 'data:image/png;base64,') === 0) {
                $imageData = substr($imageData, strlen('data:image/png;base64,'));
            }
            
            $decodedImage = base64_decode($imageData);
            
            if ($decodedImage === false) {
                Log::warning("Failed to decode signature image for signature ID: {$signature->id}");
                return;
            }
            
            // Save to temporary file
            $tempFile = tempnam(sys_get_temp_dir(), 'sig') . '.png';
            file_put_contents($tempFile, $decodedImage);
            
            // Convert frontend coordinates to PDF coordinates based on the real template size
            // Frontend uses pixels in a fixed A4-like container: width 794px, height ≈ 1123px.
            // The container has aspect-[210/297] which gives actual height = 794 * (297/210) = 1123.2px
            $containerWidthPx = 794.0;
            $containerHeightPx = 794.0 * (297.0 / 210.0); // Exact aspect ratio calculation = 1123.2px

            // Separate scale factors for X and Y to map pixels to millimeters using the actual page size
            $scaleX = $pageWidthMm / $containerWidthPx;
            $scaleY = $pageHeightMm / $containerHeightPx;

            // Convert pixel coordinates to PDF millimeters
            $x = $signature->position_x * $scaleX;
            $y = $signature->position_y * $scaleY;
            
            // IMPORTANT: There appears to be a viewport/rendering mismatch between the frontend iframe
            // and the actual PDF coordinate space. Based on testing, signatures placed at Y% in the UI
            // need adjustment to appear at the correct location in the final PDF.
            // This is likely due to PDF margins, header space, or iframe rendering differences.
            //
            // Empirical adjustment: If the signature was placed at 74% down (Y=829px -> 219mm)
            // but appears at ~35% down, we may need to shift coordinates.
            //
            // TEMPORARY FIX: Add a configurable offset or scaling factor
            // TODO: Investigate if PDF has top margin or if iframe zoom is causing mismatch
            //
            // For now, let's check if there's a pattern in the offset
            
            // Get image dimensions
            list($imgWidth, $imgHeight) = getimagesize($tempFile);
            
            // Render width to match UI display width (exact 200px in the 794px container)
            // 200px in container maps to 200 * scaleX mm
            $targetWidthMm = 200.0 * $scaleX;
            $imgWidthMm = $targetWidthMm;
            $imgHeightMm = ($imgHeight > 0 ? ($imgHeight / $imgWidth) : 0) * $imgWidthMm;
            
            // Log coordinate transformation for debugging
            Log::info("Signature placement debug", [
                'signature_id' => $signature->id ?? null,
                'input_px' => ['x' => $signature->position_x ?? null, 'y' => $signature->position_y ?? null],
                'container_px' => ['width' => $containerWidthPx, 'height' => $containerHeightPx],
                'page_mm' => ['width' => $pageWidthMm, 'height' => $pageHeightMm],
                'scale_factors' => ['x' => $scaleX, 'y' => $scaleY],
                'output_mm' => ['x' => $x, 'y' => $y],
                'signature_size_mm' => ['width' => $imgWidthMm, 'height' => $imgHeightMm],
                'percentage_down_page' => ['px' => ($signature->position_y / $containerHeightPx * 100), 'mm' => ($y / $pageHeightMm * 100)]
            ]);
            
            // Add image to PDF
            $pdf->Image($tempFile, $x, $y, $imgWidthMm, $imgHeightMm, 'PNG');
            
            // Clean up temp file
            unlink($tempFile);
            
        } catch (\Exception $e) {
            Log::error("Error adding signature to PDF: " . $e->getMessage());
        }
    }
    
    /**
     * Generate path for signed PDF
     */
    protected function generateSignedPdfPath(string $sourcePdfPath): string
    {
        $pathInfo = pathinfo($sourcePdfPath);
        $directory = $pathInfo['dirname'];
        $filename = $pathInfo['filename'];
        $extension = $pathInfo['extension'] ?? 'pdf';

        // If file is already a signed variant (ends with _signed), overwrite the same file
        if (str_ends_with($filename, '_signed')) {
            return $sourcePdfPath; // overwrite existing signed PDF
        }

        return "{$directory}/{$filename}_signed.{$extension}";
    }
    
    /**
     * Get signed PDF path if it exists, otherwise return original
     */
    public function getSignedPdfPath(string $sourcePdfPath, int $requestId, string $type = 'activity_plan'): string
    {
        $signedPath = $this->generateSignedPdfPath($sourcePdfPath);
        $disk = Storage::disk('public');
        if ($disk->exists($signedPath)) {
            return $signedPath;
        }
        
        return $sourcePdfPath;
    }
}
