import React, { useState } from 'react';

export type ActionType = 'click' | 'input' | 'select' | 'wait' | 'scroll' | 'executeScript' | 'getText' | 'getAttribute' | 'findElement' | 'waitForElement';
export type SelectorType = 'id' | 'className' | 'css' | 'xpath' | 'text';

interface ActionOrderCreatorProps {
  extensionId: string;
  onCreateOrder: (extensionId: string, actionType: ActionType, actionConfig: any) => void;
}

const ActionOrderCreator: React.FC<ActionOrderCreatorProps> = ({ extensionId, onCreateOrder }) => {
  const [actionType, setActionType] = useState<ActionType>('click');
  const [selectorType, setSelectorType] = useState<SelectorType>('id');
  const [selector, setSelector] = useState('');
  const [value, setValue] = useState('');
  const [waitTime, setWaitTime] = useState(1000);
  const [script, setScript] = useState('');

  const handleCreate = () => {
    const config: any = {
      selectorType,
    };

    if (selector) {
      config.selector = selector;
    }

    if (['input', 'select'].includes(actionType)) {
      config.value = value;
    }

    if (actionType === 'wait' || actionType === 'waitForElement') {
      config.waitTime = waitTime;
    }

    if (actionType === 'executeScript') {
      config.script = script;
    }

    onCreateOrder(extensionId, actionType, config);
    
    // Reset form
    setSelector('');
    setValue('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold mb-4">Create Action Order</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Action Type
          </label>
          <select
            value={actionType}
            onChange={(e) => setActionType(e.target.value as ActionType)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="click">Click</option>
            <option value="input">Input</option>
            <option value="select">Select</option>
            <option value="wait">Wait</option>
            <option value="scroll">Scroll</option>
            <option value="executeScript">Execute Script</option>
            <option value="getText">Get Text</option>
            <option value="getAttribute">Get Attribute</option>
            <option value="findElement">Find Element</option>
            <option value="waitForElement">Wait For Element</option>
          </select>
        </div>

        {(actionType !== 'wait' && actionType !== 'executeScript') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selector Type
            </label>
            <select
              value={selectorType}
              onChange={(e) => setSelectorType(e.target.value as SelectorType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="id">ID</option>
              <option value="className">Class Name</option>
              <option value="css">CSS Selector</option>
              <option value="xpath">XPath</option>
              <option value="text">Text Content</option>
            </select>
          </div>
        )}

        {(actionType !== 'wait' && actionType !== 'executeScript') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selector
            </label>
            <input
              type="text"
              value={selector}
              onChange={(e) => setSelector(e.target.value)}
              placeholder="Enter selector"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {['input', 'select', 'getAttribute'].includes(actionType) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Value / Attribute Name
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={actionType === 'getAttribute' ? 'Attribute name' : 'Enter value'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {(actionType === 'wait' || actionType === 'waitForElement') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Wait Time (ms)
            </label>
            <input
              type="number"
              value={waitTime}
              onChange={(e) => setWaitTime(parseInt(e.target.value) || 1000)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {actionType === 'executeScript' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Script
            </label>
            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Enter JavaScript code"
              rows={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <button
          onClick={handleCreate}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Action Order
        </button>
      </div>
    </div>
  );
};

export default ActionOrderCreator;

