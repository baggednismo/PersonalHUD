"use client";

import type { Tab, Widget } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { addTab, deleteTab, getTabs, updateTab, updateTabsOrder, getWidgets, addWidget, updateWidget, deleteWidget } from '@/lib/firestoreService';
import { generatePastelColor } from '@/lib/colorUtils';
import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Tabs as ShadTabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Edit3, Trash2, GripVertical, Settings, Palette, ExternalLink, Image as ImageIcon, LogOut, Loader2, X } from 'lucide-react';
import Image from 'next/image';

// Simplified DraggableTabItem for tab reordering
const DraggableTabItem = ({ tab, onDragStart, onDragOver, onDrop, onEdit, onDelete, isActive, onSelect }: { 
  tab: Tab; 
  onDragStart: (e: React.DragEvent<HTMLButtonElement>, tabId: string) => void;
  onDragOver: (e: React.DragEvent<HTMLButtonElement>) => void;
  onDrop: (e: React.DragEvent<HTMLButtonElement>, targetTabId: string) => void;
  onEdit: (tab: Tab) => void;
  onDelete: (tabId: string, tabLabel: string) => void;
  isActive: boolean;
  onSelect: (tabId: string) => void;
}) => {
  return (
    <ShadTabsTrigger
      value={tab.id}
      draggable
      onDragStart={(e) => onDragStart(e, tab.id)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, tab.id)}
      className={`group relative flex items-center gap-2 pr-10 ${isActive ? 'ring-2 ring-primary' : ''}`}
      onClick={() => onSelect(tab.id)}
      aria-label={`Tab ${tab.label}`}
    >
      <GripVertical className="h-4 w-4 cursor-move text-muted-foreground group-hover:text-foreground" />
      {tab.icon && <ImageIcon name={tab.icon as any} className="h-4 w-4" />}
      <span className="truncate">{tab.label}</span>
      <div className="absolute right-1 top-1/2 -translate-y-1/2 flex opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onEdit(tab); }} aria-label={`Edit tab ${tab.label}`}>
          <Edit3 className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onDelete(tab.id, tab.label); }} aria-label={`Delete tab ${tab.label}`}>
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </ShadTabsTrigger>
  );
};


export default function DashboardClient() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isTabDialogOpen, setIsTabDialogOpen] = useState(false);
  const [editingTab, setEditingTab] = useState<Tab | null>(null);
  const [tabDialogLabel, setTabDialogLabel] = useState('');
  const [tabDialogIcon, setTabDialogIcon] = useState('');

  const [isWidgetSheetOpen, setIsWidgetSheetOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);
  // Widget form state
  const [widgetName, setWidgetName] = useState('');
  const [widgetUrl, setWidgetUrl] = useState('');
  const [widgetColor, setWidgetColor] = useState(generatePastelColor());
  const [widgetIconUrl, setWidgetIconUrl] = useState('');
  const [widgetGridX, setWidgetGridX] = useState(0);
  const [widgetGridY, setWidgetGridY] = useState(0);
  const [widgetGridW, setWidgetGridW] = useState(3); // Default width
  const [widgetGridH, setWidgetGridH] = useState(2); // Default height

  const [showDeleteTabConfirm, setShowDeleteTabConfirm] = useState(false);
  const [tabToDelete, setTabToDelete] = useState<{id: string, label: string} | null>(null);
  
  const [showDeleteWidgetConfirm, setShowDeleteWidgetConfirm] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<{id: string, name?: string} | null>(null);


  const fetchAllTabs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetchedTabs = await getTabs(user.uid);
      setTabs(fetchedTabs);
      if (fetchedTabs.length > 0 && !activeTabId) {
        setActiveTabId(fetchedTabs[0].id);
      } else if (fetchedTabs.length === 0) {
        setActiveTabId(null);
      }
    } catch (error) {
      toast({ title: 'Error fetching tabs', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [user, toast, activeTabId]);

  const fetchWidgetsForTab = useCallback(async (tabId: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const fetchedWidgets = await getWidgets(user.uid, tabId);
      setWidgets(fetchedWidgets);
    } catch (error) {
      toast({ title: 'Error fetching widgets', description: (error as Error).message, variant: 'destructive' });
    }
    setIsLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchAllTabs();
  }, [fetchAllTabs]);

  useEffect(() => {
    if (activeTabId) {
      fetchWidgetsForTab(activeTabId);
    } else {
      setWidgets([]); // Clear widgets if no tab is active
    }
  }, [activeTabId, fetchWidgetsForTab]);

  const handleAddTab = () => {
    setEditingTab(null);
    setTabDialogLabel('');
    setTabDialogIcon('');
    setIsTabDialogOpen(true);
  };

  const handleEditTab = (tab: Tab) => {
    setEditingTab(tab);
    setTabDialogLabel(tab.label);
    setTabDialogIcon(tab.icon || '');
    setIsTabDialogOpen(true);
  };

  const confirmDeleteTab = (tabId: string, tabLabel: string) => {
    setTabToDelete({id: tabId, label: tabLabel});
    setShowDeleteTabConfirm(true);
  };

  const handleDeleteTab = async () => {
    if (!user || !tabToDelete) return;
    try {
      await deleteTab(user.uid, tabToDelete.id);
      toast({ title: 'Tab Deleted', description: `Tab "${tabToDelete.label}" and its widgets have been deleted.` });
      setTabToDelete(null);
      setShowDeleteTabConfirm(false);
      // Refetch tabs and potentially reset active tab
      const newTabs = tabs.filter(t => t.id !== tabToDelete.id);
      setTabs(newTabs);
      if (activeTabId === tabToDelete.id) {
        setActiveTabId(newTabs.length > 0 ? newTabs[0].id : null);
      }
    } catch (error) {
      toast({ title: 'Error deleting tab', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleSaveTab = async () => {
    if (!user || !tabDialogLabel.trim()) {
      toast({ title: 'Invalid Input', description: 'Tab label cannot be empty.', variant: 'destructive' });
      return;
    }
    try {
      if (editingTab) {
        await updateTab(user.uid, editingTab.id, { label: tabDialogLabel, icon: tabDialogIcon });
        toast({ title: 'Tab Updated', description: `Tab "${tabDialogLabel}" has been updated.` });
      } else {
        const newOrder = tabs.length > 0 ? Math.max(...tabs.map(t => t.order)) + 1 : 0;
        const newTab = await addTab(user.uid, { label: tabDialogLabel, icon: tabDialogIcon, order: newOrder });
        setTabs(prevTabs => [...prevTabs, newTab].sort((a,b) => a.order - b.order));
        setActiveTabId(newTab.id); // Make new tab active
        toast({ title: 'Tab Created', description: `Tab "${tabDialogLabel}" has been created.` });
      }
      setIsTabDialogOpen(false);
      setEditingTab(null);
      fetchAllTabs(); // Refresh to get latest order and all data
    } catch (error) {
      toast({ title: 'Error saving tab', description: (error as Error).message, variant: 'destructive' });
    }
  };

  // Drag and Drop for Tabs
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>, tabId: string) => {
    setDraggedTabId(tabId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = async (e: React.DragEvent<HTMLButtonElement>, targetTabId: string) => {
    if (!draggedTabId || draggedTabId === targetTabId || !user) return;

    const newTabs = [...tabs];
    const draggedIndex = newTabs.findIndex(tab => tab.id === draggedTabId);
    const targetIndex = newTabs.findIndex(tab => tab.id === targetTabId);

    const [draggedItem] = newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, draggedItem);

    const updatedTabsWithOrder = newTabs.map((tab, index) => ({ ...tab, order: index }));
    setTabs(updatedTabsWithOrder); // Optimistic update

    try {
      await updateTabsOrder(user.uid, updatedTabsWithOrder.map(t => ({id: t.id, order: t.order})));
      toast({ title: 'Tabs Reordered', description: 'Tab order has been saved.' });
    } catch (error) {
      toast({ title: 'Error reordering tabs', description: (error as Error).message, variant: 'destructive' });
      fetchAllTabs(); // Revert on error
    }
    setDraggedTabId(null);
  };

  // Widget actions
  const handleAddWidget = () => {
    if (!activeTabId) {
        toast({ title: 'No active tab', description: 'Please select or create a tab first.', variant: 'destructive'});
        return;
    }
    setEditingWidget(null);
    setWidgetName('');
    setWidgetUrl('');
    setWidgetColor(generatePastelColor());
    setWidgetIconUrl('');
    setWidgetGridX(0);
    setWidgetGridY(widgets.length > 0 ? Math.max(...widgets.map(w => w.gridPosition.y + w.gridPosition.h)) : 0); // Basic stacking logic
    setWidgetGridW(3);
    setWidgetGridH(2);
    setIsWidgetSheetOpen(true);
  };

  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
    setWidgetName(widget.name || '');
    setWidgetUrl((widget.data as any).url || ''); // Assuming URL widget
    setWidgetColor(widget.color);
    setWidgetIconUrl(widget.iconUrl || '');
    setWidgetGridX(widget.gridPosition.x);
    setWidgetGridY(widget.gridPosition.y);
    setWidgetGridW(widget.gridPosition.w);
    setWidgetGridH(widget.gridPosition.h);
    setIsWidgetSheetOpen(true);
  };

  const confirmDeleteWidget = (widgetId: string, widgetName?: string) => {
    setWidgetToDelete({id: widgetId, name: widgetName});
    setShowDeleteWidgetConfirm(true);
  }

  const handleDeleteWidget = async () => {
    if (!user || !activeTabId || !widgetToDelete) return;
    try {
      await deleteWidget(user.uid, activeTabId, widgetToDelete.id);
      toast({ title: 'Widget Deleted', description: `Widget "${widgetToDelete.name || 'Untitled'}" has been deleted.` });
      setWidgetToDelete(null);
      setShowDeleteWidgetConfirm(false);
      fetchWidgetsForTab(activeTabId); // Refresh widgets
    } catch (error) {
      toast({ title: 'Error deleting widget', description: (error as Error).message, variant: 'destructive' });
    }
  };
  
  const handleSaveWidget = async () => {
    if (!user || !activeTabId) return;
    if (!widgetUrl.trim()) {
        toast({title: 'Invalid URL', description: 'Widget URL cannot be empty.', variant: 'destructive'});
        return;
    }

    const widgetDataToSave = {
        type: 'url' as 'url',
        name: widgetName.trim() || undefined,
        data: { url: widgetUrl.trim() },
        color: widgetColor,
        iconUrl: widgetIconUrl.trim() || undefined,
        gridPosition: { x: widgetGridX, y: widgetGridY, w: widgetGridW, h: widgetGridH }
    };

    try {
        if (editingWidget) {
            await updateWidget(user.uid, activeTabId, editingWidget.id, widgetDataToSave);
            toast({ title: 'Widget Updated', description: `Widget "${widgetName || 'Untitled'}" updated.` });
        } else {
            await addWidget(user.uid, activeTabId, widgetDataToSave);
            toast({ title: 'Widget Added', description: `Widget "${widgetName || 'Untitled'}" added.` });
        }
        setIsWidgetSheetOpen(false);
        fetchWidgetsForTab(activeTabId);
    } catch (error) {
        toast({ title: 'Error saving widget', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (isLoading && (tabs.length === 0 && widgets.length === 0) ) { // Initial load might be true even if some data exists
    return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 border-b border-border flex justify-between items-center">
        <h1 className="text-2xl font-headline text-primary">GeminiHUD</h1>
        {user && (
          <Button variant="ghost" onClick={signOut} aria-label="Sign out">
            <LogOut className="mr-2 h-4 w-4" /> Sign Out
          </Button>
        )}
      </header>

      <ShadTabs value={activeTabId || ""} onValueChange={setActiveTabId} className="flex-grow flex flex-col">
        <div className="p-2 border-b border-border">
          <TabsList className="overflow-x-auto whitespace-nowrap">
            {tabs.map(tab => (
              <DraggableTabItem
                key={tab.id}
                tab={tab}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onEdit={handleEditTab}
                onDelete={confirmDeleteTab}
                isActive={tab.id === activeTabId}
                onSelect={setActiveTabId}
              />
            ))}
            <Button variant="ghost" onClick={handleAddTab} className="ml-2" aria-label="Add new tab">
              <PlusCircle className="h-5 w-5" />
            </Button>
          </TabsList>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
        {tabs.map(tab => (
          <TabsContent key={tab.id} value={tab.id} className="h-full">
            {activeTabId === tab.id && (
              <>
                {widgets.length === 0 && !isLoading && (
                  <div className="text-center text-muted-foreground py-10">
                    <p className="text-xl">This tab is empty.</p>
                    <Button onClick={handleAddWidget} className="mt-4" aria-label="Add new widget">
                      <PlusCircle className="mr-2 h-4 w-4" /> Add your first widget
                    </Button>
                  </div>
                )}
                {widgets.length > 0 && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4" style={{gridTemplateColumns: `repeat(${Math.min(12, widgets.reduce((max, w) => Math.max(max, w.gridPosition.x + w.gridPosition.w), 0)) || 12}, minmax(0, 1fr))`}}>
                    {widgets.map(widget => (
                      <Card 
                        key={widget.id} 
                        className="shadow-lg overflow-hidden" 
                        style={{ 
                          backgroundColor: widget.color,
                          gridColumnStart: widget.gridPosition.x + 1,
                          gridColumnEnd: `span ${widget.gridPosition.w}`,
                          gridRowStart: widget.gridPosition.y + 1,
                          gridRowEnd: `span ${widget.gridPosition.h}`,
                          minHeight: `${widget.gridPosition.h * 80}px` // Approximate height based on h units
                        }}
                      >
                        <CardHeader className="p-3 flex flex-row items-center justify-between">
                          <CardTitle className="text-lg font-medium truncate text-card-foreground" style={{color: 'hsl(var(--primary-foreground))'}}>{widget.name || 'Untitled Widget'}</CardTitle>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditWidget(widget)} aria-label={`Edit widget ${widget.name || 'Untitled'}`}>
                                <Settings className="h-4 w-4" style={{color: 'hsl(var(--primary-foreground))'}} />
                            </Button>
                             <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirmDeleteWidget(widget.id, widget.name)} aria-label={`Delete widget ${widget.name || 'Untitled'}`}>
                                <Trash2 className="h-4 w-4" style={{color: 'hsl(var(--primary-foreground))'}} />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0 h-full flex flex-col justify-center items-center">
                          {widget.iconUrl ? (
                            <a href={(widget.data as UrlWidgetData).url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex items-center justify-center">
                              <Image src={widget.iconUrl} alt={widget.name || 'Widget Icon'} width={100} height={100} className="object-contain max-h-full max-w-full p-2" data-ai-hint="logo icon"/>
                            </a>
                          ) : (
                            <a href={(widget.data as UrlWidgetData).url} target="_blank" rel="noopener noreferrer" className="p-3 text-center flex flex-col items-center justify-center h-full w-full hover:opacity-80 transition-opacity" style={{color: 'hsl(var(--primary-foreground))'}}>
                              <ExternalLink className="h-8 w-8 mb-2" />
                              <span className="text-xs truncate max-w-full">{(widget.data as UrlWidgetData).url}</span>
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
                <Button onClick={handleAddWidget} variant="outline" className="fixed bottom-6 right-6 rounded-full p-4 h-16 w-16 shadow-xl z-10" aria-label="Add new widget">
                    <PlusCircle className="h-8 w-8" />
                </Button>
              </>
            )}
          </TabsContent>
        ))}
        </div>
      </ShadTabs>

      {/* Tab Dialog */}
      <Dialog open={isTabDialogOpen} onOpenChange={setIsTabDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTab ? 'Edit Tab' : 'Create New Tab'}</DialogTitle>
            <DialogDescription>
              {editingTab ? `Update the details for "${editingTab.label}".` : 'Enter a label and optional icon for your new tab.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="tabLabel">Label</Label>
              <Input id="tabLabel" value={tabDialogLabel} onChange={(e) => setTabDialogLabel(e.target.value)} placeholder="e.g., Work Links" />
            </div>
            <div>
              <Label htmlFor="tabIcon">Icon (Lucide Icon Name or URL)</Label>
              <Input id="tabIcon" value={tabDialogIcon} onChange={(e) => setTabDialogIcon(e.target.value)} placeholder="e.g., briefacase or https://.../icon.png" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTabDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTab}>Save Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tab Confirmation Dialog */}
      <Dialog open={showDeleteTabConfirm} onOpenChange={setShowDeleteTabConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tab "{tabToDelete?.label}"?</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tab and all its widgets? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTabConfirm(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteTab}>Delete Tab</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Widget Sheet */}
        <Sheet open={isWidgetSheetOpen} onOpenChange={setIsWidgetSheetOpen}>
            <SheetContent side="bottom" className="h-[90vh] flex flex-col">
                <SheetHeader>
                    <SheetTitle>{editingWidget ? 'Edit URL Widget' : 'Add New URL Widget'}</SheetTitle>
                    <SheetDescription>
                        Configure your URL widget tile. Click "Save" when you're done.
                    </SheetDescription>
                </SheetHeader>
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    <div>
                        <Label htmlFor="widgetName">Short Name (Optional)</Label>
                        <Input id="widgetName" value={widgetName} onChange={e => setWidgetName(e.target.value)} placeholder="e.g., Google Search" />
                    </div>
                    <div>
                        <Label htmlFor="widgetUrl">URL</Label>
                        <Input id="widgetUrl" type="url" value={widgetUrl} onChange={e => setWidgetUrl(e.target.value)} placeholder="https://www.example.com" required />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex-grow">
                            <Label htmlFor="widgetColor">Tile Color</Label>
                            <Input id="widgetColor" type="color" value={widgetColor} onChange={e => setWidgetColor(e.target.value)} className="h-10" />
                        </div>
                        <Button variant="outline" onClick={() => setWidgetColor(generatePastelColor())} className="mt-6">
                            <Palette className="mr-2 h-4 w-4" /> Randomize
                        </Button>
                    </div>
                    <div>
                        <Label htmlFor="widgetIconUrl">Logo/Icon URL (Optional)</Label>
                        <Input id="widgetIconUrl" type="url" value={widgetIconUrl} onChange={e => setWidgetIconUrl(e.target.value)} placeholder="https://.../logo.png" />
                    </div>
                    <fieldset className="border p-4 rounded-md">
                        <legend className="text-sm font-medium px-1">Grid Position & Size</legend>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                            <div><Label htmlFor="gridX">X (Column)</Label><Input id="gridX" type="number" value={widgetGridX} onChange={e => setWidgetGridX(parseInt(e.target.value))} min="0" /></div>
                            <div><Label htmlFor="gridY">Y (Row)</Label><Input id="gridY" type="number" value={widgetGridY} onChange={e => setWidgetGridY(parseInt(e.target.value))} min="0" /></div>
                            <div><Label htmlFor="gridW">Width (Columns)</Label><Input id="gridW" type="number" value={widgetGridW} onChange={e => setWidgetGridW(parseInt(e.target.value))} min="1" /></div>
                            <div><Label htmlFor="gridH">Height (Rows)</Label><Input id="gridH" type="number" value={widgetGridH} onChange={e => setWidgetGridH(parseInt(e.target.value))} min="1" /></div>
                        </div>
                    </fieldset>
                </div>
                 <div className="p-4 border-t flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsWidgetSheetOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveWidget}>Save Widget</Button>
                </div>
            </SheetContent>
        </Sheet>

        {/* Delete Widget Confirmation Dialog */}
        <Dialog open={showDeleteWidgetConfirm} onOpenChange={setShowDeleteWidgetConfirm}>
            <DialogContent>
            <DialogHeader>
                <DialogTitle>Delete Widget "{widgetToDelete?.name || 'Untitled'}"?</DialogTitle>
                <DialogDescription>
                Are you sure you want to delete this widget? This action cannot be undone.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteWidgetConfirm(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteWidget}>Delete Widget</Button>
            </DialogFooter>
            </DialogContent>
        </Dialog>

    </div>
  );
}
