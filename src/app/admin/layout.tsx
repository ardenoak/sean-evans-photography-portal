export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory">
      {/* Luxury Admin Header */}
      <header className="bg-charcoal/95 backdrop-blur-sm border-b border-gold/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              <div className="flex items-center justify-center">
                <img
                  src="/sean-evans-logo.png"
                  alt="Sean Evans Photography"
                  className="h-16 w-auto brightness-0 invert"
                />
              </div>
              <div className="border-l border-gold/30 pl-6">
                <h1 className="text-xl font-light text-ivory tracking-wide">Admin Portal</h1>
                <span className="text-gold/80 text-xs font-light tracking-wider uppercase">Management Console</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-ivory/90 text-sm font-light">Direct Access</div>
                <div className="text-gold text-sm font-medium">Administrator</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        <div className="max-w-7xl mx-auto py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}