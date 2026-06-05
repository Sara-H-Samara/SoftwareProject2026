import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

interface BreadcrumbItem {
  name: string;
  path: string;
  isCurrent?: boolean;
}

export default function Breadcrumb() {
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const paths = location.pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    items.push({ name: 'Home', path: '/', isCurrent: paths.length === 0 });

    let currentPath = '';
    paths.forEach((path, index) => {
      currentPath += `/${path}`;
      const isLast = index === paths.length - 1;

      let name = path;
      if (path === 'galleries') name = 'Galleries';
      else if (path === 'artwork') name = 'Artwork';
      else if (path === 'dashboard') name = 'Dashboard';
      else if (path === 'search') name = 'Search';
      else if (path === 'activity') name = 'Activity';
      else if (path === 'notifications') name = 'Notifications';
      else if (path === 'orders') name = 'Orders';
      else if (path === 'cart') name = 'Cart';
      else if (path === 'checkout') name = 'Checkout';
      else if (path === 'profile') name = 'Profile';
      else if (path === 'visitor') name = 'Visitor';
      else if (path === 'analytics') name = 'Analytics';
      else if (path === 'artworks') name = 'Artworks';
      else if (path === 'upload') name = 'Upload';
      else if (path === 'layout') name = 'Layout';
      else if (path === 'edit') name = 'Edit';
      else if (path.match(/^[0-9a-fA-F-]{36}$/)) {
        name = isLast ? 'Details' : '...';
      }

      items.push({
        name,
        path: currentPath,
        isCurrent: isLast,
      });
    });

    setBreadcrumbs(items);
  }, [location]);

  // Don't show breadcrumb on homepage or 3D pages
  if (breadcrumbs.length <= 1 || location.pathname.includes('/3d')) {
    return null;
  }

  return (
    <div className="sticky top-16 z-20 bg-white/95 backdrop-blur-sm border-b border-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-2.5">
          <nav className="flex items-center gap-1 text-xs text-stone-500">
            {breadcrumbs.map((item, index) => (
              <div key={item.path} className="flex items-center">
                {index > 0 && (
                  <ChevronRightIcon className="w-3.5 h-3.5 mx-1 text-stone-400 flex-shrink-0" />
                )}
                {item.isCurrent ? (
                  <span className="text-stone-800 font-medium text-xs">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    to={item.path}
                    className="hover:text-gallery-600 transition-colors flex items-center gap-1 text-stone-500"
                  >
                    {index === 0 && <HomeIcon className="w-3.5 h-3.5" />}
                    <span>{item.name}</span>
                  </Link>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}