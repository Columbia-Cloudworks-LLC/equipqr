
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package } from 'lucide-react';
import { Equipment } from '@/types';
import { EquipmentList } from '@/components/Equipment/EquipmentList';
import { EquipmentCard } from '@/components/Equipment/EquipmentCard';
import { MOCK_EQUIPMENT } from '@/data/mockData';
import { Layout } from '@/components/Layout/Layout';

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [view, setView] = useState<string>('list');

  useEffect(() => {
    // In a real app, we would fetch data from an API
    setEquipment(MOCK_EQUIPMENT);
  }, []);

  return (
    <Layout>
      <div className="flex-1 space-y-6 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
          <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
          <Button asChild>
            <Link to="/equipment/new">
              <Package className="mr-2 h-4 w-4" />
              Add Equipment
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="list" value={view} onValueChange={setView}>
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="grid">Grid View</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="list" className="mt-4">
            <EquipmentList equipment={equipment} />
          </TabsContent>
          
          <TabsContent value="grid" className="mt-4">
            {equipment.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {equipment.map((item) => (
                  <EquipmentCard key={item.id} equipment={item} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 border border-dashed rounded-lg">
                <Package className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-muted-foreground">No equipment found</p>
                <Button variant="link" asChild>
                  <Link to="/equipment/new">Add your first equipment</Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EquipmentPage;
