export default function GalleryTab() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="text-center max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-xl p-12 transform hover:scale-105 transition-transform duration-300">
          <div className="w-24 h-24 bg-gradient-to-r from-gold to-gold/80 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl text-white shadow-lg">
            📸
          </div>
          
          <h2 className="text-3xl font-didot text-charcoal mb-4">Gallery Coming Soon</h2>
          
          <p className="text-warm-gray text-lg mb-6">
            Your beautiful portrait gallery will be delivered here after your session.
          </p>
          
          <div className="bg-ivory p-6 rounded-lg mb-6">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="w-3 h-3 bg-verde rounded-full animate-pulse"></div>
              <span className="text-charcoal font-semibold">Expected Delivery</span>
            </div>
            <p className="text-2xl font-didot text-charcoal">March 17, 2025</p>
            <p className="text-sm text-warm-gray">Preview gallery with 20+ favorites</p>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-verde/10 rounded-lg">
              <div className="text-2xl font-bold text-verde">87+</div>
              <div className="text-sm text-warm-gray">Images Expected</div>
            </div>
            <div className="p-4 bg-gold/10 rounded-lg">
              <div className="text-2xl font-bold text-gold">2-3</div>
              <div className="text-sm text-warm-gray">Business Days</div>
            </div>
            <div className="p-4 bg-charcoal/10 rounded-lg">
              <div className="text-2xl font-bold text-charcoal">365</div>
              <div className="text-sm text-warm-gray">Days Access</div>
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gradient-to-r from-verde/5 to-gold/5 rounded-lg border-l-4 border-verde">
            <p className="text-sm text-charcoal">
              <strong>What to expect:</strong> Your preview gallery will include professionally edited favorites, 
              followed by the complete gallery with all images from your session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}