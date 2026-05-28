import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { MenuItem } from '../../types';
import { DownloadIcon, UploadIcon, ExclamationTriangleIcon, CheckCircleIcon } from '../../components/Icons';

interface MenuExcelManagerProps {
    menuItems: MenuItem[];
    onImport: (items: MenuItem[]) => Promise<void>;
    businessName?: string;
}

// Excel columns for menu template
const TEMPLATE_COLUMNS = [
    'name',
    'nameAr',
    'category',
    'categoryAr',
    'price',
    'oldPrice',
    'description',
    'descriptionAr',
    'imageUrl',
    'isAvailable',
    'isTodaysOffer'
];

// Column descriptions for template header
const COLUMN_DESCRIPTIONS: Record<string, string> = {
    name: 'Item name (English)',
    nameAr: 'Item name (Arabic)',
    category: 'Category (English)',
    categoryAr: 'Category (Arabic)',
    price: 'Price (e.g., 25.00)',
    oldPrice: 'Old price for discounts (optional)',
    description: 'Description (English, optional)',
    descriptionAr: 'Description (Arabic, optional)',
    imageUrl: 'Image URL (Drive link, any URL)',
    isAvailable: 'Available? (TRUE/FALSE)',
    isTodaysOffer: 'Today\'s Offer? (TRUE/FALSE, optional)'
};

const MenuExcelManager: React.FC<MenuExcelManagerProps> = ({
    menuItems,
    onImport,
    businessName = 'Menu'
}) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [pendingItems, setPendingItems] = useState<MenuItem[]>([]);
    const [previewItems, setPreviewItems] = useState<MenuItem[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Generate unique ID
    const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Export blank template
    const handleExportTemplate = () => {
        const wb = XLSX.utils.book_new();

        // Create header row with descriptions
        const wsData = [
            TEMPLATE_COLUMNS,
            Object.values(COLUMN_DESCRIPTIONS),
            // Add sample row
            ['Burger Deluxe', 'برجر ديلوكس', 'Burgers', 'برجر', '35.00', '45.00', 'Juicy beef patty with special sauce', 'لحم بقري عصير مع صلصة خاصة', 'https://drive.google.com/...', 'TRUE', 'FALSE']
        ];

        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Set column widths
        ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));

        XLSX.utils.book_append_sheet(wb, ws, 'Menu Template');
        XLSX.writeFile(wb, `${businessName}_menu_template.xlsx`);

        setSuccess('Template downloaded! Fill it and import to add your menu.');
        setTimeout(() => setSuccess(null), 3000);
    };

    // Export current menu
    const handleExportCurrentMenu = () => {
        if (menuItems.length === 0) {
            setError('No menu items to export.');
            setTimeout(() => setError(null), 3000);
            return;
        }

        try {
            const wb = XLSX.utils.book_new();

            // Transform menu items to export format
            // NOTE: Skip base64 images (data: URLs) as they exceed Excel's 32,767 char cell limit
            const exportData = menuItems.map(item => {
                const imageUrl = item.imageUrl || '';
                const isBase64 = imageUrl.startsWith('data:');

                return {
                    name: item.name,
                    nameAr: item.nameAr || '',
                    category: item.category,
                    categoryAr: item.categoryAr || '',
                    price: item.price,
                    oldPrice: item.oldPrice || '',
                    description: item.description || '',
                    descriptionAr: item.descriptionAr || '',
                    imageUrl: isBase64 ? '[Local Image - Re-upload after import]' : imageUrl,
                    isAvailable: item.isAvailable ? 'TRUE' : 'FALSE',
                    isTodaysOffer: 'FALSE'
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            ws['!cols'] = TEMPLATE_COLUMNS.map(() => ({ wch: 20 }));

            XLSX.utils.book_append_sheet(wb, ws, 'Menu');
            XLSX.writeFile(wb, `${businessName}_menu_export.xlsx`);

            const base64Count = menuItems.filter(i => (i.imageUrl || '').startsWith('data:')).length;
            if (base64Count > 0) {
                setSuccess(`Exported ${menuItems.length} items! Note: ${base64Count} local images need to be re-uploaded.`);
            } else {
                setSuccess(`Exported ${menuItems.length} menu items!`);
            }
            setTimeout(() => setSuccess(null), 5000);
        } catch (err) {
            console.error('Excel export error:', err);
            setError('Failed to export menu. Please try again.');
            setTimeout(() => setError(null), 5000);
        }
    };

    // Handle file selection
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setError(null);

        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);

            // Skip description row if present
            const dataRows = jsonData.filter((row: any) =>
                row.name &&
                typeof row.name === 'string' &&
                !row.name.includes('(English)')
            );

            if (dataRows.length === 0) {
                setError('No valid menu items found in the Excel file.');
                return;
            }

            // Transform to MenuItem format
            // IMPORTANT: Use empty strings instead of undefined (Firestore rejects undefined)
            const items: MenuItem[] = dataRows.map((row: any) => ({
                id: generateId(),
                name: String(row.name || '').trim(),
                nameAr: row.nameAr ? String(row.nameAr).trim() : '',
                category: String(row.category || 'General').trim(),
                categoryAr: row.categoryAr ? String(row.categoryAr).trim() : '',
                price: String(row.price || '0'),
                oldPrice: row.oldPrice ? String(row.oldPrice) : '',
                description: row.description ? String(row.description).trim() : '',
                descriptionAr: row.descriptionAr ? String(row.descriptionAr).trim() : '',
                imageUrl: row.imageUrl && !String(row.imageUrl).includes('[Local Image') ? String(row.imageUrl).trim() : '',
                isAvailable: String(row.isAvailable).toUpperCase() !== 'FALSE'
            }));

            // Validate items
            const invalidItems = items.filter(item => !item.name || !item.category);
            if (invalidItems.length > 0) {
                setError(`${invalidItems.length} items are missing required fields (name/category).`);
                return;
            }

            setPendingItems(items);
            setPreviewItems(items.slice(0, 5)); // Preview first 5
            setShowConfirmModal(true);

        } catch (err) {
            console.error('Excel parse error:', err);
            setError('Failed to parse Excel file. Please check the format.');
        }

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Confirm import
    const handleConfirmImport = async () => {
        setIsImporting(true);
        try {
            await onImport(pendingItems);
            setShowConfirmModal(false);
            setPendingItems([]);
            setPreviewItems([]);
            setSuccess(`Successfully imported ${pendingItems.length} menu items!`);
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Import failed:', err);
            setError('Failed to save menu items. Please try again.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={handleExportTemplate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all"
                >
                    <DownloadIcon className="h-4 w-4" />
                    Download Template
                </button>

                <button
                    onClick={handleExportCurrentMenu}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl font-bold text-sm transition-all"
                >
                    <DownloadIcon className="h-4 w-4" />
                    Export Menu
                </button>

                <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all cursor-pointer">
                    <UploadIcon className="h-4 w-4" />
                    Import Excel
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileSelect}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Feedback Messages */}
            {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                    <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
                    {error}
                </div>
            )}

            {success && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
                    <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
                    {success}
                </div>
            )}

            {/* Import Confirmation Modal */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-0 sm:p-4 pt-0 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-fade-in">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="p-3 bg-amber-100 rounded-full">
                                <ExclamationTriangleIcon className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Replace Menu Items?</h3>
                                <p className="text-sm text-slate-500 mt-1">
                                    Importing will <strong>REMOVE all existing {menuItems.length} menu items</strong> and replace with {pendingItems.length} new items from Excel.
                                </p>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="bg-slate-50 rounded-2xl p-4 mb-4 max-h-48 overflow-y-auto">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                                Preview ({previewItems.length} of {pendingItems.length})
                            </p>
                            <div className="space-y-2">
                                {previewItems.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="font-medium text-slate-700">{item.name}</span>
                                        <span className="text-indigo-600 font-bold">{item.price}</span>
                                    </div>
                                ))}
                                {pendingItems.length > 5 && (
                                    <p className="text-xs text-slate-400 italic">
                                        ...and {pendingItems.length - 5} more items
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setPendingItems([]);
                                    setPreviewItems([]);
                                }}
                                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmImport}
                                disabled={isImporting}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isImporting ? 'Saving...' : 'Replace All Items'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuExcelManager;
