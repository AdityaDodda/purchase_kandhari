import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Edit2, Trash2, Package, AlertCircle, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);
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

  // Filter inventory based on search term
  const filteredInventory = useMemo(() => {
    if (!inventory || !searchTerm) return inventory || [];
    return inventory.filter((item: any) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const checkStock = (itemName: string) => {
    if (!inventory) return null;
    return inventory.find((item: any) => 
      item.name.toLowerCase().includes(itemName.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(itemName.toLowerCase())
    );
  };

  const handleAddItem = () => {
    const stockInfo = checkStock(formData.itemName);
    const calculatedEstimatedCost = (formData.requiredQuantity || 0) * (formData.estimatedCost || 0);
    const newItem = {
      ...formData,
      id: Date.now(), // Temporary ID
      stockAvailable: stockInfo?.quantity || 0,
      stockLocation: stockInfo?.location || "",
      estimatedCost: calculatedEstimatedCost,
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
    setFormData({
      ...item,
      estimatedCost: item.estimatedCost / (item.requiredQuantity || 1), // Set unit cost for editing
    });
    setShowAddDialog(true);
  };

  const handleUpdateItem = () => {
    const stockInfo = checkStock(formData.itemName);
    const calculatedEstimatedCost = (formData.requiredQuantity || 0) * (formData.estimatedCost || 0);
    const updatedItem = {
      ...formData,
      stockAvailable: stockInfo?.quantity || 0,
      stockLocation: stockInfo?.location || "",
      estimatedCost: calculatedEstimatedCost,
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

  // Calculate total cost
  const totalCost = items.reduce((sum, item) => sum + (item.requiredQuantity * (item.estimatedCost / (item.requiredQuantity || 1)) || 0), 0);

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
                <div className="md:col-span-2">
                  <Label htmlFor="itemName">Item Name</Label>
                  
                  {/* Search Input */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search inventory items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Inventory Dropdown */}
                  {searchTerm && filteredInventory.length > 0 && (
                    <div className="border rounded-md max-h-48 overflow-y-auto mb-2 bg-white shadow-sm">
                      {filteredInventory.map((item: any) => (
                        <div
                          key={item.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => {
                            setSelectedInventoryItem(item);
                            setFormData({
                              ...formData,
                              itemName: item.name,
                              requiredQuantity: Math.min(5, item.quantity || 1), // Default to 5 or available stock
                              estimatedCost: item.unitCost || 0,
                              unitOfMeasure: item.unitOfMeasure || "",
                              stockAvailable: item.quantity || 0,
                              stockLocation: item.location || ""
                            });
                            setSearchTerm("");
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-sm text-gray-500">
                              Code: {item.itemCode} | Stock: {item.quantity} {item.unitOfMeasure} | ₹{item.unitCost}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual Item Entry */}
                  <Input
                    placeholder="Or enter custom item name"
                    value={formData.itemName}
                    onChange={(e) => {
                      setFormData({...formData, itemName: e.target.value});
                      setSelectedInventoryItem(null);
                    }}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="requiredQuantity">Required Quantity</Label>
                  <Input
                    id="requiredQuantity"
                    type="number"
                    value={formData.requiredQuantity}
                    onChange={(e) => {
                      const requestedQty = parseInt(e.target.value) || 1;
                      setFormData({...formData, requiredQuantity: requestedQty});
                    }}
                    placeholder="1"
                    min="1"
                  />
                  {selectedInventoryItem && formData.requiredQuantity > selectedInventoryItem.quantity && (
                    <div className="mt-1 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <p className="text-yellow-800">
                        <strong>Stock Alert:</strong> Only {selectedInventoryItem.quantity} available in stock.
                      </p>
                      <p className="text-yellow-700 text-xs mt-1">
                        Requesting {formData.requiredQuantity - selectedInventoryItem.quantity} additional units beyond stock.
                      </p>
                    </div>
                  )}
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
                  <Label htmlFor="estimatedCost">Estimated Cost (₹) <span className="text-xs text-gray-400">(per unit)</span></Label>
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
        <Card>
          <CardContent className="p-0">
            {/* Excel-style table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-3 font-semibold text-sm border-r">#</th>
                    <th className="text-left p-3 font-semibold text-sm border-r min-w-[200px]">Item Name</th>
                    <th className="text-left p-3 font-semibold text-sm border-r">Qty</th>
                    <th className="text-left p-3 font-semibold text-sm border-r">Unit</th>
                    <th className="text-left p-3 font-semibold text-sm border-r">Required By</th>
                    <th className="text-left p-3 font-semibold text-sm border-r">Location</th>
                    <th className="text-left p-3 font-semibold text-sm border-r">Cost (₹)</th>
                    <th className="text-left p-3 font-semibold text-sm border-r">Stock Status</th>
                    {editable && <th className="text-center p-3 font-semibold text-sm">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id || index} className="border-b hover:bg-gray-50">
                      <td className="p-3 border-r text-sm font-medium">{index + 1}</td>
                      <td className="p-3 border-r">
                        <div className="font-medium text-sm">{item.itemName}</div>
                        {item.itemJustification && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={item.itemJustification}>
                            {item.itemJustification}
                          </div>
                        )}
                      </td>
                      <td className="p-3 border-r text-sm">{item.requiredQuantity}</td>
                      <td className="p-3 border-r text-sm">{item.unitOfMeasure}</td>
                      <td className="p-3 border-r text-sm">{new Date(item.requiredByDate).toLocaleDateString()}</td>
                      <td className="p-3 border-r text-sm">{item.deliveryLocation}</td>
                      <td className="p-3 border-r text-sm font-semibold text-green-600">
                        ₹{(item.requiredQuantity * (item.estimatedCost / (item.requiredQuantity || 1))).toLocaleString()}
                      </td>
                      <td className="p-3 border-r text-sm">
                        {getStockBadge(item)}
                        {getStockStatus(item) !== "in-stock" && (
                          <div className="flex items-center text-xs text-amber-600 mt-1">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            {getStockStatus(item) === "low-stock" 
                              ? `Only ${item.stockAvailable} left` 
                              : "Out of stock"}
                          </div>
                        )}
                      </td>
                      {editable && (
                        <td className="p-3 text-center">
                          <div className="flex justify-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditItem(item)}
                              className="h-8 w-8 p-0 hover:bg-blue-100"
                            >
                              <Edit2 className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteItem(item.id)}
                              className="h-8 w-8 p-0 hover:bg-red-100"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                  {/* Total row */}
                  <tr className="border-t-2 bg-blue-50">
                    <td colSpan={editable ? 6 : 5} className="p-3 text-right font-semibold text-sm">
                      Total Estimated Cost:
                    </td>
                    <td className="p-3 border-r font-bold text-lg text-green-700">
                      ₹{totalCost.toLocaleString()}
                    </td>
                    <td className="p-3 border-r"></td>
                    {editable && <td className="p-3"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}