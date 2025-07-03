import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Filter, Calendar, User, Clock, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { WorkOrderFilters as FiltersType } from '@/types/workOrder';

interface WorkOrderFiltersProps {
  filters: FiltersType;
  activeFilterCount: number;
  showMobileFilters: boolean;
  onShowMobileFiltersChange: (show: boolean) => void;
  onFilterChange: (key: keyof FiltersType, value: string) => void;
  onClearFilters: () => void;
  onQuickFilter: (preset: string) => void;
}

export const WorkOrderFilters: React.FC<WorkOrderFiltersProps> = ({
  filters,
  activeFilterCount,
  showMobileFilters,
  onShowMobileFiltersChange,
  onFilterChange,
  onClearFilters,
  onQuickFilter
}) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
          <Input
            placeholder="Search work orders..."
            value={filters.searchQuery}
            onChange={(e) => onFilterChange('searchQuery', e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>

        {/* Filter Button with Active Count and Quick Presets */}
        <div className="flex gap-2">
          <Sheet open={showMobileFilters} onOpenChange={onShowMobileFiltersChange}>
            <SheetTrigger asChild>
              <Button variant="outline" className="flex-1 h-12 justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                      {activeFilterCount}
                    </Badge>
                  )}
                </div>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[90vh]">
              <SheetHeader className="pb-4">
                <SheetTitle>Filter Work Orders</SheetTitle>
              </SheetHeader>
              
              {/* Quick Filter Presets */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-3">Quick Filters</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => onQuickFilter('my-work')}
                      className="h-12 justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      My Work
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onQuickFilter('urgent')}
                      className="h-12 justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Urgent
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onQuickFilter('overdue')}
                      className="h-12 justify-start"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Overdue
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onQuickFilter('unassigned')}
                      className="h-12 justify-start"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Unassigned
                    </Button>
                  </div>
                </div>

                {/* Detailed Filters */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Detailed Filters</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Status</label>
                      <Select value={filters.statusFilter} onValueChange={(value) => onFilterChange('statusFilter', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="submitted">Submitted</SelectItem>
                          <SelectItem value="accepted">Accepted</SelectItem>
                          <SelectItem value="assigned">Assigned</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="on_hold">On Hold</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Assignee</label>
                      <Select value={filters.assigneeFilter} onValueChange={(value) => onFilterChange('assigneeFilter', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="All Assignees" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Assignees</SelectItem>
                          <SelectItem value="mine">My Work Orders</SelectItem>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Priority</label>
                      <Select value={filters.priorityFilter} onValueChange={(value) => onFilterChange('priorityFilter', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="All Priorities" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Priorities</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Due Date</label>
                      <Select value={filters.dueDateFilter} onValueChange={(value) => onFilterChange('dueDateFilter', value)}>
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="All Dates" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Dates</SelectItem>
                          <SelectItem value="overdue">Overdue</SelectItem>
                          <SelectItem value="today">Due Today</SelectItem>
                          <SelectItem value="this_week">This Week</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear All Button */}
                  <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="w-full h-12"
                  >
                    Clear All Filters
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Active Filter Summary */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filters.statusFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Status: {filters.statusFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFilterChange('statusFilter', 'all')}
                />
              </Badge>
            )}
            {filters.assigneeFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Assignee: {filters.assigneeFilter === 'mine' ? 'Mine' : filters.assigneeFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFilterChange('assigneeFilter', 'all')}
                />
              </Badge>
            )}
            {filters.priorityFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Priority: {filters.priorityFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFilterChange('priorityFilter', 'all')}
                />
              </Badge>
            )}
            {filters.dueDateFilter !== 'all' && (
              <Badge variant="secondary" className="flex items-center gap-1">
                Due: {filters.dueDateFilter}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => onFilterChange('dueDateFilter', 'all')}
                />
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  }

  // Desktop Filters
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search work orders..."
                  value={filters.searchQuery}
                  onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={filters.statusFilter} onValueChange={(value) => onFilterChange('statusFilter', value)}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Select value={filters.assigneeFilter} onValueChange={(value) => onFilterChange('assigneeFilter', value)}>
              <SelectTrigger>
                <User className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="mine">My Work Orders</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.priorityFilter} onValueChange={(value) => onFilterChange('priorityFilter', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.dueDateFilter} onValueChange={(value) => onFilterChange('dueDateFilter', value)}>
              <SelectTrigger>
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Due Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="today">Due Today</SelectItem>
                <SelectItem value="this_week">This Week</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={onClearFilters}
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};