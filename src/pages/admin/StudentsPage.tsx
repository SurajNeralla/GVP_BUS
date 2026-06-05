import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Search, GraduationCap } from 'lucide-react'

export default function StudentsPage() {
  const [search, setSearch] = useState('')

  const { data: students = [] } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*, registrations(status, bus:buses(bus_number))')
        .eq('role', 'student')
        .order('created_at', { ascending: false })
      return data ?? []
    },
  })

  const filtered = students.filter((s: any) =>
    !search || [s.full_name, s.roll_number, s.email, s.department]
      .join(' ').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Students</h1>

      <div className="flex items-center gap-2 input mb-5 max-w-md">
        <Search size={15} style={{ color: 'hsl(var(--text-muted))' }} />
        <input
          type="text"
          placeholder="Search by name, roll no, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent outline-none flex-1 text-sm"
          style={{ color: 'hsl(var(--text-primary))' }}
        />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr><th>Student</th><th>Roll No</th><th>Dept</th><th>Year</th><th>Phone</th><th>Bus</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => {
                const reg = s.registrations?.[0]
                return (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ background: 'var(--gradient-primary)' }}>
                          {s.full_name?.charAt(0) ?? '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{s.full_name ?? '—'}</p>
                          <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-sm">{s.roll_number ?? '—'}</td>
                    <td className="text-sm">{s.department ?? '—'}</td>
                    <td className="text-sm">{s.year ? `Y${s.year}` : '—'}</td>
                    <td className="text-sm">{s.phone ?? '—'}</td>
                    <td className="text-sm">{reg?.bus?.bus_number ?? <span style={{ color: 'hsl(var(--text-muted))' }}>Unassigned</span>}</td>
                    <td>
                      {reg ? (
                        <span className={`badge badge-${reg.status}`}>{reg.status}</span>
                      ) : (
                        <span className="badge badge-not_started">No application</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center" style={{ color: 'hsl(var(--text-muted))' }}>
              <GraduationCap size={32} className="mx-auto mb-3 opacity-30" />
              No students found.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
