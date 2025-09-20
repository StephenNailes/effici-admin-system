import React, { useState, useEffect } from "react";
import MainLayout from "@/layouts/mainlayout";
import { Download, FileText, Check, X, ArrowLeft, Calendar, Users, MapPin } from "lucide-react";
import axios from "axios";
import { router } from "@inertiajs/react";

interface Props {
  id: string;
}

export default function ActivityPlanApproval({ id }: Props) {
  const [activityPlan, setActivityPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // For now, use dummy data since we need to match the image exactly
    const dummyData = {
      approval_id: parseInt(id),
      title: "Tech Summit 2025",
      student_name: "Stephen Nailes",
      organization: "Computer Science Society",
      event_date: "July 15, 2025 • 9:00 AM - 5:00 PM",
      description: "To bring together tech enthusiasts, industry experts, and students for a day of learning, networking, and innovation sharing.",
      priority: "Normal",
      approval_status: "pending",
      submitted_at: "2025-05-02T10:30:00Z",
      comments: [
        {
          author: "Sarah Admin",
          date: "2 days ago",
          text: "Please provide more details about the technical workshop speakers and their topics."
        }
      ]
    };
    
    setActivityPlan(dummyData);
    setLoading(false);

    // In production, you would fetch the actual data:
    // axios.get(`/api/approvals/${id}`)
    //   .then(res => {
    //     setActivityPlan(res.data);
    //     setLoading(false);
    //   })
    //   .catch(err => {
    //     console.error('Error loading activity plan:', err);
    //     setLoading(false);
    //   });
  }, [id]);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/approvals/${id}/approve`);
      router.visit('/admin/requests');
    } catch (err) {
      console.error('Error approving activity plan:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevision = async () => {
    setSubmitting(true);
    try {
      await axios.post(`/api/approvals/${id}/revision`, { remarks });
      router.visit('/admin/requests');
    } catch (err) {
      console.error('Error requesting revision:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-gray-600">Loading activity plan...</div>
        </div>
      </MainLayout>
    );
  }

  if (!activityPlan) {
    return (
      <MainLayout>
        <div className="p-6 flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Activity plan not found.</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 font-poppins">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.visit('/admin/requests')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{activityPlan.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                Submitted by {activityPlan.student_name} • 
                <span className={`ml-2 inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                  activityPlan.approval_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  activityPlan.approval_status === 'approved' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {activityPlan.approval_status === "revision_requested" ? "Under Revision" : activityPlan.approval_status}
                </span>
                <span className="ml-2 text-gray-500">{activityPlan.submitted_at ? new Date(activityPlan.submitted_at).toLocaleDateString() : 'May 2, 2025'}</span>
              </p>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
              activityPlan.priority?.toLowerCase() === 'urgent' ? 'bg-red-100 text-red-800' :
              activityPlan.priority?.toLowerCase() === 'normal' ? 'bg-blue-100 text-blue-800' :
              'bg-green-100 text-green-800'
            }`}>
              {activityPlan.priority}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1">
          {/* Left Side - Document Viewer */}
          <div className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow-sm h-full">
              {/* Document Header */}
              <div className="border-b border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Activity Plan Request</h2>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                    <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                      <FileText className="w-4 h-4" />
                      Fullscreen
                    </button>
                  </div>
                </div>
              </div>

              {/* Document Preview - Matching the exact image layout */}
              <div className="p-6 h-full overflow-y-auto">
                <div className="bg-white border rounded-lg p-8 shadow-inner min-h-[700px]" style={{ 
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23f3f4f6" fill-opacity="0.4"%3E%3Ccircle cx="3" cy="3" r="1"/%3E%3C/g%3E%3C/svg%3E")',
                }}>
                  {/* Document Header with Logo */}
                  <div className="flex items-start gap-4 mb-8 pb-4 border-b border-pink-200">
                    <div className="w-16 h-16 bg-pink-100 rounded-lg flex items-center justify-center">
                      <div className="w-8 h-8 bg-pink-500 rounded"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-pink-600 mb-1">University of the Immaculate Conception</h3>
                      <p className="text-sm text-gray-600">Activity Plan Request Form</p>
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Document ID: APR-2025-001</p>
                        <p>Generated: {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Form Content */}
                  <div className="space-y-6">
                    {/* Event Information */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">Event Information</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Activity Name:</span>
                          <p className="text-gray-900 mt-1">{activityPlan.title}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Organization:</span>
                          <p className="text-gray-900 mt-1">{activityPlan.organization}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Event Date & Time:</span>
                          <p className="text-gray-900 mt-1">{activityPlan.event_date}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Venue:</span>
                          <p className="text-gray-900 mt-1">University Auditorium</p>
                        </div>
                      </div>
                    </div>

                    {/* Objectives */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">Objectives</h4>
                      <ul className="text-sm text-gray-900 space-y-2 list-disc list-inside">
                        <li>Promote innovation and technological advancement among students</li>
                        <li>Facilitate networking between industry professionals and students</li>
                        <li>Showcase cutting-edge technologies and research projects</li>
                        <li>Encourage collaboration and knowledge sharing</li>
                      </ul>
                    </div>

                    {/* Description */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">Description</h4>
                      <p className="text-sm text-gray-900 leading-relaxed">{activityPlan.description}</p>
                    </div>

                    {/* Expected Participants */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">Expected Participants</h4>
                      <p className="text-sm text-gray-900">Approximately 200-300 students, faculty members, and industry professionals</p>
                    </div>

                    {/* Budget Requirements */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3 pb-1 border-b border-gray-200">Budget Requirements</h4>
                      <div className="text-sm text-gray-900">
                        <div className="flex justify-between py-1">
                          <span>Venue Setup</span>
                          <span>₱15,000</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Speaker Honorarium</span>
                          <span>₱25,000</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Materials & Supplies</span>
                          <span>₱8,000</span>
                        </div>
                        <div className="flex justify-between py-1">
                          <span>Refreshments</span>
                          <span>₱12,000</span>
                        </div>
                        <div className="flex justify-between py-1 font-medium border-t border-gray-200 pt-2">
                          <span>Total</span>
                          <span>₱60,000</span>
                        </div>
                      </div>
                    </div>

                    {/* Signatures */}
                    <div className="mt-12 pt-8 border-t border-gray-200">
                      <div className="grid grid-cols-2 gap-8 text-sm">
                        <div>
                          <p className="font-medium text-gray-700 mb-4">Prepared by:</p>
                          <div className="border-b border-gray-400 mb-2 h-8"></div>
                          <p className="text-center font-medium">{activityPlan.student_name}</p>
                          <p className="text-center text-gray-600">Student Organizer</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-700 mb-4">Approved by:</p>
                          <div className="border-b border-gray-400 mb-2 h-8"></div>
                          <p className="text-center font-medium">_________________</p>
                          <p className="text-center text-gray-600">Admin Assistant</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Details & Actions */}
          <div className="w-96 p-6">
            <div className="space-y-6">
              {/* Event Details Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Organization</p>
                      <p className="text-gray-900">{activityPlan.organization}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Date & Time</p>
                      <p className="text-gray-900">{activityPlan.event_date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">Venue</p>
                      <p className="text-gray-900">University Auditorium</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{activityPlan.description}</p>
              </div>

              {/* Actions Card */}
              {activityPlan.approval_status === 'pending' && (
                <div className="bg-white rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleApprove}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      {submitting ? 'Processing...' : 'Approve Request'}
                    </button>
                    
                    <button
                      onClick={handleRevision}
                      disabled={submitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      {submitting ? 'Processing...' : 'Request Revision'}
                    </button>
                  </div>
                </div>
              )}

              {/* Comments/Remarks Card */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>
                
                {/* Previous Comments */}
                {activityPlan.comments && activityPlan.comments.length > 0 && (
                  <div className="mb-4">
                    {activityPlan.comments.map((comment: any, index: number) => (
                      <div key={index} className="bg-gray-50 rounded p-3 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                            <span className="text-xs text-white font-medium">
                              {comment.author.split(' ').map((n: string) => n[0]).join('')}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900 text-sm">{comment.author}</span>
                          <span className="text-xs text-gray-500">{comment.date}</span>
                        </div>
                        <p className="text-gray-700 text-sm">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Add your comment
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Add remarks or feedback..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              {/* Download Actions */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Downloads</h3>
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <Download className="w-4 h-4" />
                  Download All Files
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}