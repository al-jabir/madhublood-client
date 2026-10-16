import { lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { RootLayout } from "@/layouts/RootLayout";
import { Info } from "@/components/feedback/Info";
import { RequireUser } from "@/features/auth/components/RequireUser";
import { content } from "@/i18n/content";
const Home = lazy(() =>
  import("@/features/home/pages/Home").then((module) => ({
    default: module.Home,
  })),
);
const Donors = lazy(() =>
  import("@/features/donors/pages/Donors").then((module) => ({
    default: module.Donors,
  })),
);
const Requests = lazy(() =>
  import("@/features/blood-requests/pages/Requests").then((module) => ({
    default: module.Requests,
  })),
);
const CreateRequest = lazy(() =>
  import("@/features/blood-requests/pages/CreateRequest").then((module) => ({
    default: module.CreateRequest,
  })),
);
const RequestDetail = lazy(() =>
  import("@/features/blood-requests/pages/RequestDetail").then((module) => ({
    default: module.RequestDetail,
  })),
);
const EditRequest = lazy(() =>
  import("@/features/blood-requests/pages/EditRequest").then((module) => ({
    default: module.EditRequest,
  })),
);
const AuthPage = lazy(() =>
  import("@/features/auth/pages/AuthPage").then((module) => ({
    default: module.AuthPage,
  })),
);
const Verify = lazy(() =>
  import("@/features/auth/pages/Verify").then((module) => ({
    default: module.Verify,
  })),
);
const Dashboard = lazy(() =>
  import("@/features/profile/pages/Dashboard").then((module) => ({
    default: module.Dashboard,
  })),
);
const Admin = lazy(() =>
  import("@/features/admin/pages/Admin").then((module) => ({
    default: module.Admin,
  })),
);
const Article = lazy(() =>
  import("@/features/information/pages/Article").then((module) => ({
    default: module.Article,
  })),
);
export function AppRouter() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/donors" element={<Donors />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/requests/new" element={<CreateRequest />} />
        <Route path="/requests/:id" element={<RequestDetail />} />
        <Route
          path="/requests/:id/edit"
          element={
            <RequireUser>
              <EditRequest />
            </RequireUser>
          }
        />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/verify-otp" element={<Info title="Email sign-in" text="Phone verification is no longer required. Sign in with your email and complete your profile." action />} />
        <Route path="/forgot-password" element={<Verify reset />} />
        <Route path="/reset-password" element={<Verify reset />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route
          path="/403"
          element={
            <Info
              title="403"
              text="এই পৃষ্ঠায় আপনার প্রবেশাধিকার নেই। Access denied."
            />
          }
        />
        <Route
          path="/500"
          element={
            <Info title="500" text="সাময়িক সমস্যা হয়েছে। Please try again." />
          }
        />
        {Object.keys(content).map((key) => (
          <Route key={key} path={"/" + key} element={<Article page={key} />} />
        ))}
        <Route
          path="*"
          element={
            <Info title="404" text="পৃষ্ঠাটি পাওয়া যায়নি। Page not found." />
          }
        />
      </Route>
    </Routes>
  );
}
