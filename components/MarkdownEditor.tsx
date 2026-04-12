'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = '输入内容...',
  minHeight = '200px'
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
      {/* 标签切换 */}
      <div className="flex border-b border-gray-200 bg-gray-50">
        <button
          type="button"
          onClick={() => setActiveTab('write')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'write'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          编写
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'preview'
              ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          预览
        </button>
      </div>

      {/* 内容区 */}
      {activeTab === 'write' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 outline-none resize-none"
          style={{ minHeight }}
        />
      ) : (
        <div 
          className="markdown-content p-4" 
          style={{ minHeight }}
        >
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400">暂无内容预览</p>
          )}
        </div>
      )}

      {/* 工具栏 */}
      {activeTab === 'write' && (
        <div className="flex items-center gap-2 p-2 border-t border-gray-200 bg-gray-50 text-sm text-gray-500">
          <span>支持 Markdown 语法</span>
          <span className="mx-2">|</span>
          <span>**粗体**</span>
          <span>*斜体*</span>
          <span>`代码`</span>
          <span>[链接](url)</span>
        </div>
      )}
    </div>
  );
}
