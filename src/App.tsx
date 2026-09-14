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
import { applyBrandColor } from './utils/theme';

export default function App() {
  const [content, setContent] = useState<SalesPageContent>(DEFAULT_CONTENT);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Apply primary brand color dynamically to CSS variables whenever it updates
  useEffect(() => {
    if (content.primaryBrandColor) {
      applyBrandColor(content.primaryBrandColor);
    }
  }, [content.primaryBrandColor]);

  // Load latest content in the background and verify admin auth
  useEffect(() => {
    let isMounted = true;
    async function init() {
      try {
        const [fetchedContent, isAuth] = await Promise.all([
          api.getContent(),
          api.verifyAuth()
        ]);
        if (isMounted) {
          if (fetchedContent) {
            setContent(fetchedContent);
          }
          setIsAuthenticated(isAuth);
        }
      } catch (err) {
        console.error('Failed to sync app state:', err);
      } finally {
        if (isMounted) {
          setAuthChecking(false);
        }
      }
    }
    init();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setAuthChecking(false);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
  };

  const handleContentUpdate = (newContent: SalesPageContent) => {
    setContent(newContent);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Sales Page Route — renders instantly with no blocking spinner */}
        <Route path="/" element={<SalesPage content={content} />} />

        {/* CMS Route (/admin) — checks auth state before revealing CMS */}
        <Route
          path="/admin"
          element={
            authChecking ? (
              <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-3 border-[#0022DA] border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="font-serif text-[#0F172A] text-sm">Verifying admin access...</p>
                </div>
              </div>
            ) : isAuthenticated ? (
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
