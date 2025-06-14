
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Users, Settings, Building, Map } from 'lucide-react';

export function QuickLinksCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/equipment">
            <Package className="mr-2 h-4 w-4" />
            Equipment Inventory
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/fleet-map">
            <Map className="mr-2 h-4 w-4" />
            Fleet Map
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/teams">
            <Users className="mr-2 h-4 w-4" />
            Team Management
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/profile">
            <Settings className="mr-2 h-4 w-4" />
            Profile Settings
          </Link>
        </Button>
        <Button variant="outline" className="w-full justify-start" asChild>
          <Link to="/organization">
            <Building className="mr-2 h-4 w-4" />
            Organization Settings
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
