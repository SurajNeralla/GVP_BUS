export default function SettingsPage() {
  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: 'Hanken Grotesk', color: 'hsl(var(--text-primary))' }}>Settings</h1>
      <div className="card-glass p-6 max-w-lg">
        <h2 className="font-semibold mb-4" style={{ color: 'hsl(var(--text-primary))' }}>System Information</h2>
        {[
          { label: 'App Name', value: 'GVPCDPGC Smart Bus Portal' },
          { label: 'College', value: 'GVP College of Degree & PG Courses' },
          { label: 'Email Domain', value: '@gvpcdpgc.edu.in' },
          { label: 'Version', value: '1.0.0' },
        ].map(({ label, value }) => (
          <div key={label} className="flex justify-between py-3" style={{ borderBottom: '1px solid hsl(var(--border-subtle))' }}>
            <span className="text-sm" style={{ color: 'hsl(var(--text-muted))' }}>{label}</span>
            <span className="text-sm font-medium" style={{ color: 'hsl(var(--text-primary))' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
