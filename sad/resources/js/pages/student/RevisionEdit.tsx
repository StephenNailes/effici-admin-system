import MainLayout from '@/layouts/mainlayout'
import { useState } from 'react'
import { router } from '@inertiajs/react'

// Define revision type
interface Revision {
  id: number
  title: string
  details?: string
  comment: string
}

// Define props
interface RevisionEditProps {
  revision: Revision
}

export default function RevisionEdit({ revision }: RevisionEditProps) {
  const [formData, setFormData] = useState({
    title: revision.title,
    details: revision.details ?? '',
  })

  const handleSubmit = () => {
    router.post(route('student.revision.update', revision.id), formData)
  }

  return (
    <MainLayout>
      <div className="p-6 font-poppins">
        <h1 className="text-2xl font-bold text-black mb-4">Revise Request</h1>
        <p className="text-black text-sm mb-4">Reviewer comment: {revision.comment}</p>

        <input
          type="text"
          value={formData.title}
          onChange={(e) =>
            setFormData({ ...formData, title: e.target.value })
          }
          className="w-full p-2 border rounded-lg mb-3 text-black"
        />

        <textarea
          placeholder="Update request details..."
          value={formData.details}
          onChange={(e) =>
            setFormData({ ...formData, details: e.target.value })
          }
          className="w-full p-2 border rounded-lg mb-3 text-black"
        />

        <button className="w-full bg-gray-200 py-2 rounded-lg mb-3 text-black">
          🔄 Regenerate Document Preview
        </button>

        <div className="flex justify-end gap-2">
          <a href={route('student.revision')} className="px-4 py-2 rounded-lg border text-black">
            Cancel
          </a>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
          >
            Submit Revision
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
