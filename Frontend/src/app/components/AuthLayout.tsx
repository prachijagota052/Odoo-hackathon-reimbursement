import React from 'react';

interface AuthLayoutProps {
  children: React.ReactNode;
  imageUrl?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, imageUrl }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Right side - Image/Brand (hidden on mobile) */}
      <div 
        className="hidden lg:flex flex-1 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 items-center justify-center p-12"
        style={imageUrl ? { backgroundImage: `url(${imageUrl})`, backgroundSize: 'cover' } : {}}
      >
        <div className="text-white text-center space-y-6">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-4xl mb-4">Reimbursement Management</h1>
          <p className="text-xl opacity-90 max-w-md mx-auto">
            Streamline your expense approvals with OCR scanning, multi-currency support, and multi-level workflows
          </p>
          <div className="grid grid-cols-2 gap-4 mt-8 text-left max-w-lg mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-1">📸</div>
              <div className="text-sm opacity-90">OCR Scanning</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-1">💱</div>
              <div className="text-sm opacity-90">Multi-Currency</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-1">✅</div>
              <div className="text-sm opacity-90">Smart Approvals</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-sm opacity-90">Real-time Tracking</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};