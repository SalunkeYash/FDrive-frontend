import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "@/components/headerComponents/Header";
import SideMenu from "@/components/SideMenu";
import MyDrive from "@/pages/MyDrive";
import FolderView from "@/pages/FolderView";
import Starred from "@/pages/Starred";
import Trash from "@/pages/Trash";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import SharedWithMe from "@/pages/SharedWithMe";
import SharedLinkPage from "@/pages/SharedLinkPage";
import OpenSharedItemPage from "@/pages/OpenSharedItemPage";
import { DriveProvider } from "@/context/DriveContext";
import { useAuth } from "@/auth/AuthContext";

function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bgc text-textC">
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;

  return (
    <DriveProvider>
      <main className="flex h-screen flex-col overflow-hidden bg-bgc">
        <Header />
        <section className="mb-5 flex flex-1 overflow-hidden px-5 pr-16">
          <div>
            <SideMenu />
          </div>
          <div className="flex flex-1">
            <div className="h-[90vh] w-full overflow-hidden rounded-2xl bg-white">
              <Outlet />
            </div>
          </div>
        </section>
      </main>
    </DriveProvider>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/share/:token" element={<SharedLinkPage />} />
      <Route path="/open/:resourceType/:resourceId" element={<OpenSharedItemPage />} />
      <Route element={<AppLayout />}>
        <Route index element={<Navigate to="/drive/my-drive" replace />} />
        <Route path="drive" element={<Navigate to="/drive/my-drive" replace />} />
        <Route path="drive/my-drive" element={<MyDrive />} />
        <Route path="drive/shared" element={<SharedWithMe />} />
        <Route path="drive/folders/:folderId" element={<FolderView />} />
        <Route path="drive/starred" element={<Starred />} />
        <Route path="drive/trash" element={<Trash />} />
        <Route path="*" element={<Navigate to="/drive/my-drive" replace />} />
      </Route>
    </Routes>
  );
}
