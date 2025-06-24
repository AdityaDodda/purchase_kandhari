import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface LineItem {
  id?: number;
  itemName: string;
  requiredQuantity: number;
  unitOfMeasure: string;
  requiredByDate: string;
  deliveryLocation: string;
  estimatedCost: number;
  itemJustification?: string;
  stockAvailable?: number;
  stockLocation?: string;
}

interface LineItemsGridProps {
  items: LineItem[];
  onItemsChange: (items: LineItem[]) => void;
  editable?: boolean;
}

export function LineItemsGrid({ items, onItemsChange, editable = true }: LineItemsGridProps) {
  const [editingItem, setEditingItem] = useState<LineItem | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState<LineItem>({
    itemName: "",
    requiredQuantity: 1,
    unitOfMeasure: "",
    requiredByDate: "",
    deliveryLocation: "",
    estimatedCost: 0,
    itemJustification: "",
    stockAvailable: 0,
    stockLocation: "",
  });

  const { toast } = useToast();

  // Fetch inventory for stock checking
  const { data: inventory } = useQuery({
    queryKey: ["/api/inventory"],
    enabled: editable
  });

  const checkStock = (itemName: string) => {
    if (!inventory) return null;
    return inventory.find((item: any) => 
      item.name.toLowerCase().includes(itemName.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(itemName.toLowerCase())
    );
  };

  const handleAddItem = () => {
    const stockInfo = checkStock(formData.itemName);
    const newItem = {
      ...formData,
      id: Date.now(), // Temporary ID
      stockAvailable: stockInfo?.quantity || 0,
      stockLocation: stockInfo?.location || "",
    };

    // Validate stock availability
    if (stockInfo && stockInfo.quantity < formData.requiredQuantity) {
      toast({
        title: "Stock Warning",
        description: `Only ${stockInfo.quantity} ${formData.unitOfMeasure} available in stock. Required: ${formData.requiredQuantity}`,
        variant: "destructive"
      });
    }

    onItemsChange([...items, newItem]);
    setFormData({
      itemName: "",
      requiredQuantity: 1,
      unitOfMeasure: "",
      requiredByDate: "",
      deliveryLocation: "",
      estimatedCost: 0,
      itemJustification: "",
      stockAvailable: 0,
      stockLocation: "",
    });
    setShowAddDialog(false);
  };

  const handleEditItem = (item: LineItem) => {
    setEditingItem(item);
    setFormData(item);
    setShowAddDialog(true);
  };

  const handleUpdateItem = () => {
    const stockInfo = checkStock(formData.itemName);
    const updatedItem = {
      ...formData,
      stockAvailable: stockInfo?.quantity || 0,
      stockLocation: stockInfo?.location || "",
    };

    // Validate stock availability
    if (stockInfo && stockInfo.quantity < formData.requiredQuantity) {
      toast({
        title: "Stock Warning",
        description: `Only ${stockInfo.quantity} ${formData.unitOfMeasure} available in stock. Required: ${formData.requiredQuantity}`,
        variant: "destructive"
      });
    }

    const updatedItems = items.map(item => 
      item.id === editingItem?.id ? updatedItem : item
    );
    onItemsChange(updatedItems);
    setEditingItem(null);
    setShowAddDialog(false);
  };

  const handleDeleteItem = (itemId: number | undefined) => {
    const filteredItems = items.filter(item => item.id !== itemId);
    onItemsChange(filteredItems);
  };

  const getStockStatus = (item: LineItem) => {
    if (!item.stockAvailable) return "out-of-stock";
    if (item.stockAvailable < item.requiredQuantity) return "low-stock";
    return "in-stock";
  };

  const getStockBadge = (item: LineItem) => {
    const status = getStockStatus(item);
    const colors = {
      "in-stock": "bg-green-100 text-green-800",
      "low-stock": "bg-yellow-100 text-yellow-800",
      "out-of-stock": "bg-red-100 text-red-800"
    };
    const labels = {
      "in-stock": "In Stock",
      "low-stock": "Low Stock",
      "out-of-stock": "Out of Stock"
    };

    return (
      <Badge className={colors[status]}>
        {labels[status]} ({item.stockAvailable || 0})
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Line Items ({items.length})
        </h3>
        {editable && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="bg-[hsl(207,90%,54%)] hover:bg-[hsl(211,100%,29%)]">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Edit Line Item" : "Add Line Item"}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">Item Name</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="requiredQuantity">Required Quantity</Label>
                  <Input
                    id="requiredQuantity"
                    type="number"
                    value={formData.requiredQuantity}
                    onChange={(e) => setFormData({...formData, requiredQuantity: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="unitOfMeasure">Unit of Measure</Label>
                  <Select value={formData.unitOfMeasure} onValueChange={(value) => setFormData({...formData, unitOfMeasure: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pcs">Pieces</SelectItem>
                      <SelectItem value="kg">Kilograms</SelectItem>
                      <SelectItem value="ltr">Liters</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="set">Set</SelectItem>
                      <SelectItem value="mtr">Meters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="requiredByDate">Required By Date</Label>
                  <Input
                    id="requiredByDate"
                    type="date"
                    value={formData.requiredByDate}
                    onChange={(e) => setFormData({...formData, requiredByDate: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="deliveryLocation">Delivery Location</Label>
                  <Input
                    id="deliveryLocation"
                    value={formData.deliveryLocation}
                    onChange={(e) => setFormData({...formData, deliveryLocation: e.target.value})}
                    placeholder="Enter delivery location"
                  />
                </div>
                <div>
                  <Label htmlFor="estimatedCost">Estimated Cost (₹)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    step="0.01"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({...formData, estimatedCost: parseFloat(e.target.value) || 0})}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="itemJustification">Item Justification</Label>
                  <Textarea
                    id="itemJustification"
                    value={formData.itemJustification}
                    onChange={(e) => setFormData({...formData, itemJustification: e.target.value})}
                    placeholder="Explain why this item is needed"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => {
                  setShowAddDialog(false);
                  setEditingItem(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={editingItem ? handleUpdateItem : handleAddItem}>
                  {editingItem ? "Update Item" : "Add Item"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {items.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No line items added yet</p>
            {editable && (
              <p className="text-sm text-gray-400 mt-2">Click "Add Item" to get started</p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item, index) => (
            <Card key={item.id || index} className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base font-semibold">
                    {index + 1}. {item.itemName}
                  </CardTitle>
                  {editable && (
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditItem(item)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                {getStockBadge(item)}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <div className="font-medium">{item.requiredQuantity} {item.unitOfMeasure}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Cost:</span>
                    <div className="font-medium text-green-600">₹{item.estimatedCost.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Required By:</span>
                    <div className="font-medium">{new Date(item.requiredByDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Location:</span>
                    <div className="font-medium">{item.deliveryLocation}</div>
                  </div>
                </div>
                
                {item.itemJustification && (
                  <div className="text-sm">
                    <span className="text-gray-500">Justification:</span>
                    <p className="text-gray-700 mt-1">{item.itemJustification}</p>
                  </div>
                )}

                {getStockStatus(item) !== "in-stock" && (
                  <div className="flex items-center text-sm text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {getStockStatus(item) === "low-stock" 
                      ? `Only ${item.stockAvailable} available` 
                      : "Item not in stock"}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}