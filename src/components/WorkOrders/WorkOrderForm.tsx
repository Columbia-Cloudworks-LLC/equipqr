
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CreateWorkOrderParams } from '@/types/workOrders';

interface WorkOrderFormProps {
  equipmentId: string;
  onSubmit: (params: CreateWorkOrderParams) => Promise<void>;
  isSubmitting?: boolean;
}

export function WorkOrderForm({ equipmentId, onSubmit, isSubmitting = false }: WorkOrderFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !description.trim()) {
      return;
    }

    await onSubmit({
      equipment_id: equipmentId,
      title: title.trim(),
      description: description.trim()
    });

    // Reset form
    setTitle('');
    setDescription('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Submit Work Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the work needed"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of the work required"
              rows={4}
              required
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isSubmitting || !title.trim() || !description.trim()}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Work Order'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
