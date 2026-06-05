import { useState } from 'react';
import { ShareIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

interface ShareButtonProps {
  title: string;
  url: string;
  description?: string;
  variant?: 'icon' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

export default function ShareButton({
  title,
  url,
  description = '',
  variant = 'icon',
  size = 'md',
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareData = {
    title,
    text: description,
    url,
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      setIsOpen(true);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle} - ${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}&summary=${encodedDescription}`,
  };

  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const buttonSizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  if (variant === 'button') {
    return (
      <div className="relative">
        <button
          onClick={handleNativeShare}
          className={`flex items-center gap-2 rounded-lg bg-gallery-600 text-white hover:bg-gallery-700 transition-colors ${buttonSizeClasses[size]}`}
        >
          <ShareIcon className={iconSizes[size]} />
          <span>Share</span>
        </button>

        {isOpen && (
          <ShareModal
            shareLinks={shareLinks}
            onCopyLink={handleCopyLink}
            onClose={() => setIsOpen(false)}
            copied={copied}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className={`rounded-full hover:bg-stone-100 transition-colors ${sizeClasses[size]}`}
        aria-label="Share"
      >
        <ShareIcon className={iconSizes[size]} />
      </button>

      {isOpen && (
        <ShareModal
          shareLinks={shareLinks}
          onCopyLink={handleCopyLink}
          onClose={() => setIsOpen(false)}
          copied={copied}
        />
      )}
    </div>
  );
}

interface ShareModalProps {
  shareLinks: {
    facebook: string;
    twitter: string;
    whatsapp: string;
    telegram: string;
    linkedin: string;
  };
  onCopyLink: () => void;
  onClose: () => void;
  copied: boolean;
}

function ShareModal({
  shareLinks,
  onCopyLink,
  onClose,
  copied,
}: ShareModalProps) {
  const platforms = [
    { name: 'Facebook', icon: '📘', color: 'from-blue-500 to-blue-600', link: shareLinks.facebook },
    { name: 'Twitter', icon: '🐦', color: 'from-sky-400 to-sky-500', link: shareLinks.twitter },
    { name: 'WhatsApp', icon: '💬', color: 'from-green-400 to-green-500', link: shareLinks.whatsapp },
    { name: 'Telegram', icon: '✈️', color: 'from-cyan-400 to-cyan-500', link: shareLinks.telegram },
    { name: 'LinkedIn', icon: '🔗', color: 'from-blue-600 to-blue-700', link: shareLinks.linkedin },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4">
      
      {/* Modal Card */}
      <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl border border-stone-200 overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-semibold text-stone-800">
              Share Artwork
            </h3>
            <p className="text-xs text-stone-400">
              Send it to your friends
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-100 transition"
          >
            <XMarkIcon className="w-5 h-5 text-stone-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">

          {/* Platforms */}
          <div className="grid grid-cols-2 gap-3">
            {platforms.map((p) => (
              <a
                key={p.name}
                href={p.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl text-white
                  bg-gradient-to-r ${p.color}
                  hover:scale-[1.02] active:scale-95 transition-all shadow-md`}
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-sm font-medium">{p.name}</span>
              </a>
            ))}
          </div>

          {/* Copy link */}
          <button
            onClick={onCopyLink}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
              bg-stone-100 hover:bg-stone-200 transition font-medium text-stone-700"
          >
            {copied ? (
              <>
                <CheckIcon className="w-5 h-5 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                🔗 Copy link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}