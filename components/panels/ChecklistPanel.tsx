
import React, { useState } from 'react';
import { PREFLIGHT_CHECKLIST_ITEMS } from '../../constants';

const ChecklistPanel: React.FC = () => {
    const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

    const handleCheck = (item: string) => {
        setCheckedItems(prev => ({
            ...prev,
            [item]: !prev[item],
        }));
    };
    
    const allChecked = PREFLIGHT_CHECKLIST_ITEMS.every(item => checkedItems[item]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-100">Pre-Flight Checklist</h3>
                {allChecked && (
                    <span className="px-2 py-1 text-xs font-bold text-green-800 bg-secondary rounded-full">
                        ALL CLEAR
                    </span>
                )}
            </div>

            <div className="space-y-2">
                {PREFLIGHT_CHECKLIST_ITEMS.map((item, index) => (
                    <label key={index} className="flex items-center space-x-3 p-3 bg-base-100 rounded-md cursor-pointer hover:bg-base-300/50 transition-colors">
                        <input
                            type="checkbox"
                            checked={!!checkedItems[item]}
                            onChange={() => handleCheck(item)}
                            className="h-5 w-5 rounded bg-base-300 border-slate-500 text-primary focus:ring-primary"
                        />
                        <span className={`flex-1 ${checkedItems[item] ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                            {item}
                        </span>
                    </label>
                ))}
            </div>
        </div>
    );
};

export default ChecklistPanel;
