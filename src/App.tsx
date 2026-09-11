/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SalesPage } from './components/SalesPage';
import { AdminLogin } from './components/AdminLogin';
import { AdminCMS } from './components/AdminCMS';
import { SalesPageContent } from './types';
import { DEFAULT_CONTENT } from './defaultContent';
import { api } from './services/api';

export default function App() {
  const [content, setContent] = useState<SalesPageContent>(DEFAULT_CONTENT);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Load initial content and check admin authentication status
  useEffect(() => {
    async function init() {
      try {
        const [fetchedContent, isAuth] = await Promise.all([
          api.getContent(),
          api.verifyAuth()
        ]);
        setContent(fetchedContent);
        setIsAuthenticated(isAuth);
      } catch (err) {
        console.error('Failed to initialize app state:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
  };

  const handleContentUpdate = (newContent: SalesPageContent) => {
    setContent(newContent);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF6EC] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-[#A64B2A] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="font-serif text-[#24344B] text-sm">Loading Home Training Blueprint...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Sales Page Route */}
        <Route path="/" element={<SalesPage content={content} />} />

        {/* CMS Route (/admin) */}
        <Route
          path="/admin"
          element={
            isAuthenticated ? (
              <AdminCMS
                initialContent={content}
                onContentUpdate={handleContentUpdate}
                onLogout={handleLogout}
              />
            ) : (
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Alias for /cms */}
        <Route path="/cms" element={<Navigate to="/admin" replace />} />

        {/* Catch-all redirects back to public sales page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
