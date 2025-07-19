
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { isLightColor } from '@/lib/utils';

interface TopBarProps {
  title?: string;
  breadcrumb?: string;
  backgroundColor?: string;
}

const TopBar: React.FC<TopBarProps> = ({ title, breadcrumb, backgroundColor }) => {
  const textColorClass = backgroundColor && !isLightColor(backgroundColor) 
    ? 'text-white' 
    : 'text-foreground';
  
  const separatorColorClass = backgroundColor && !isLightColor(backgroundColor) 
    ? 'border-white/20' 
    : 'border-border';

  const headerStyle = backgroundColor 
    ? { backgroundColor } 
    : {};

  return (
    <header 
      className="flex h-14 sm:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b sm:border-b-0"
      style={headerStyle}
    >
      <div className={`flex items-center gap-2 px-3 sm:px-4 w-full ${textColorClass}`}>
        <SidebarTrigger className="-ml-1 flex-shrink-0" />
        <Separator orientation="vertical" className={`mr-2 h-4 hidden sm:block ${separatorColorClass}`} />
        <div className="flex-1 min-w-0">
          {breadcrumb && (
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm sm:text-base truncate">{breadcrumb}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          )}
          {title && !breadcrumb && (
            <h1 className="text-base sm:text-lg font-semibold truncate">{title}</h1>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
