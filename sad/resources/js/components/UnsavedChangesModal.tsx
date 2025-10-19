import React, { useEffect } from 'react';
import Modal from '@/components/Modal';
import { AlertTriangle, X } from 'lucide-react';

export interface UnsavedChangesModalProps {
	open: boolean;
	onCancel: () => void;
	onExit: () => void;
}

export default function UnsavedChangesModal({ open, onCancel, onExit }: UnsavedChangesModalProps) {
	useEffect(() => {
		if (!open) return;
		// Find the modal backdrop element created by Modal.tsx and override its blur
		const backdrop = document.querySelector('.backdrop-blur-sm') as HTMLElement | null;
		if (!backdrop) return;
		// Save original values
		const prevBackdropFilter = backdrop.style.backdropFilter;
		const prevBackground = backdrop.style.backgroundColor;
		// Remove blur and set a slightly darker overlay
		backdrop.style.backdropFilter = 'none';
		backdrop.style.backgroundColor = 'rgba(0,0,0,0.28)';

		return () => {
			backdrop.style.backdropFilter = prevBackdropFilter;
			backdrop.style.backgroundColor = prevBackground;
		};
	}, [open]);

	return (
		<Modal open={open} onClose={onCancel}>
			{/* Header */}
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
						<AlertTriangle className="w-5 h-5" />
					</div>
					<h3 className="text-lg font-semibold text-gray-900">Unsaved changes</h3>
				</div>
				<button
					onClick={onCancel}
					className="text-gray-400 hover:text-gray-600 transition-colors"
					aria-label="Close"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			{/* Body */}
			<div className="mt-3 text-sm text-gray-700 leading-relaxed">
				Are you sure you want to exit the editor with unsaved changes?
			</div>

			{/* Footer */}
			<div className="mt-5 flex justify-end gap-2">
				<button
					className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
					onClick={onCancel}
				>
					Cancel
				</button>
				<button
					className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
					onClick={onExit}
				>
					Exit without saving
				</button>
			</div>
		</Modal>
	);
}

