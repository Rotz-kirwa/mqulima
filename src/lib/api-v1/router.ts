import { handleAuthRegister, handleAuthLogin, handleAuthMe, handleUpdateProfile } from "./auth";
import { handleListProducts, handleFeaturedProducts, handleGetProduct, handleGetCategories, handleGetProductsByIds } from "./products";
import { handleCreateOrder, handleGetMyOrders } from "./orders";
import { handleMpesaStkPush, handlePaymentStatus, handlePaystackInitialize, handlePaystackVerify } from "./payments";
import { handleForumFeed, handleCreatePost, handleGetPost, handleAddComment, handleToggleLike, handleBookmarkPost } from "./forum";
import { handleListNews, handleGetNewsArticle } from "./news";
import { handleListCourses, handleGetCourse, handleAcademyWaitlist } from "./academy";
import { handleListServices, handleServiceBooking } from "./services";
import { handleWeather, handleMarketPrices } from "./tools";
import { handleAiChat, handleCropDoctor } from "./ai";
import { handleUploadPresign } from "./upload";
import {
  handleAdminOverview,
  handleAdminResourceList,
  handleAdminGetRecord,
  handleAdminSaveRecord,
  handleAdminStateUpdate,
  handleAdminForumModeration,
} from "./admin";

export async function handleApiV1Request(request: Request, url: URL): Promise<Response> {
  const method = request.method.toUpperCase();
  const path = url.pathname.replace(/\/$/, "");

  // CORS preflight handling for mobile web previews
  if (method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS, PATCH",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Cache-Control, Accept, Range",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  try {
    // 1. Auth routes
    if (path === "/api/v1/auth/register" && method === "POST") {
      return await handleAuthRegister(request);
    }
    if (path === "/api/v1/auth/login" && method === "POST") {
      return await handleAuthLogin(request);
    }
    if (path === "/api/v1/auth/me" && method === "GET") {
      return await handleAuthMe(request);
    }
    if ((path === "/api/v1/user/profile" || path === "/api/v1/auth/profile") && (method === "PUT" || method === "POST")) {
      return await handleUpdateProfile(request);
    }

    // 2. Products / AgroShop
    if (path === "/api/v1/products/featured" && method === "GET") {
      return await handleFeaturedProducts();
    }
    if (path === "/api/v1/products" && method === "GET") {
      return await handleListProducts(request, url);
    }
    if (path === "/api/v1/categories" && method === "GET") {
      return await handleGetCategories();
    }
    if (path === "/api/v1/products/by-ids" && method === "GET") {
      return await handleGetProductsByIds(url);
    }
    const productDetailMatch = path.match(/^\/api\/v1\/products\/([^/]+)$/);
    if (productDetailMatch && method === "GET") {
      return await handleGetProduct(decodeURIComponent(productDetailMatch[1]));
    }

    // 3. Orders
    if (path === "/api/v1/orders" && method === "POST") {
      return await handleCreateOrder(request);
    }
    if (path === "/api/v1/orders" && method === "GET") {
      return await handleGetMyOrders(request);
    }

    // 4. Payments
    if (path === "/api/v1/payments/mpesa/stk-push" && method === "POST") {
      return await handleMpesaStkPush(request);
    }
    const paymentStatusMatch = path.match(/^\/api\/v1\/payments\/status\/([^/]+)$/);
    if (paymentStatusMatch && method === "GET") {
      return await handlePaymentStatus(decodeURIComponent(paymentStatusMatch[1]));
    }
    if (path === "/api/v1/payments/paystack/initialize" && method === "POST") {
      return await handlePaystackInitialize(request);
    }
    if (path === "/api/v1/payments/paystack/verify" && method === "POST") {
      return await handlePaystackVerify(request);
    }

    // 5. Community Forum
    if ((path === "/api/v1/forum/feed" || path === "/api/v1/threads/feed" || path === "/api/v1/threads") && method === "GET") {
      return await handleForumFeed(request, url);
    }
    if ((path === "/api/v1/forum/posts" || path === "/api/v1/threads") && method === "POST") {
      return await handleCreatePost(request);
    }
    const postCommentsMatch = path.match(/^\/api\/v1\/(?:forum\/posts|threads)\/([^/]+)\/comments$/);
    if (postCommentsMatch && method === "POST") {
      return await handleAddComment(decodeURIComponent(postCommentsMatch[1]), request);
    }
    const postLikeMatch = path.match(/^\/api\/v1\/(?:forum\/posts|threads)\/([^/]+)\/like$/);
    if (postLikeMatch && method === "POST") {
      return await handleToggleLike(decodeURIComponent(postLikeMatch[1]), request);
    }
    const postBookmarkMatch = path.match(/^\/api\/v1\/(?:forum\/posts|threads)\/([^/]+)\/bookmark$/);
    if (postBookmarkMatch && method === "POST") {
      return await handleBookmarkPost(decodeURIComponent(postBookmarkMatch[1]), request);
    }
    const postDetailMatch = path.match(/^\/api\/v1\/(?:forum\/posts|threads)\/([^/]+)$/);
    if (postDetailMatch && method === "GET") {
      return await handleGetPost(decodeURIComponent(postDetailMatch[1]), request);
    }

    // 6. News & Articles
    if ((path === "/api/v1/news" || path === "/api/v1/articles") && method === "GET") {
      return await handleListNews(url);
    }
    const newsDetailMatch = path.match(/^\/api\/v1\/(?:news|articles)\/([^/]+)$/);
    if (newsDetailMatch && method === "GET") {
      return await handleGetNewsArticle(decodeURIComponent(newsDetailMatch[1]));
    }

    // 7. Academy & Courses
    if ((path === "/api/v1/academy/courses" || path === "/api/v1/courses") && method === "GET") {
      return await handleListCourses();
    }
    const courseDetailMatch = path.match(/^\/api\/v1\/(?:academy\/courses|courses)\/([^/]+)$/);
    if (courseDetailMatch && method === "GET") {
      return await handleGetCourse(decodeURIComponent(courseDetailMatch[1]));
    }
    if ((path === "/api/v1/academy/waitlist" || path === "/api/v1/waitlist") && method === "POST") {
      return await handleAcademyWaitlist(request);
    }

    // 8. Services
    if (path === "/api/v1/services/categories" && method === "GET") {
      return await handleListServices();
    }
    if ((path === "/api/v1/services/booking" || path === "/api/v1/service-requests") && method === "POST") {
      return await handleServiceBooking(request);
    }

    // 9. Tools (Weather & Markets)
    if (path === "/api/v1/tools/weather" && method === "GET") {
      return await handleWeather(url);
    }
    if ((path === "/api/v1/tools/markets" || path === "/api/v1/markets") && method === "GET") {
      return await handleMarketPrices();
    }

    // 10. AI (Chat & Crop Doctor)
    if (path === "/api/v1/ai/chat" && method === "POST") {
      return await handleAiChat(request);
    }
    if (path === "/api/v1/ai/crop-doctor" && method === "POST") {
      return await handleCropDoctor(request);
    }

    // 11. Upload presigning (Cloudflare R2 / S3)
    if (path === "/api/v1/upload/presign" && method === "POST") {
      return await handleUploadPresign(request);
    }

    // 12. Admin Console API
    if (path === "/api/v1/admin/overview" && method === "GET") {
      return await handleAdminOverview(request);
    }
    const adminForumCommentModMatch = path.match(/^\/api\/v1\/admin\/forum\/([^/]+)\/comments\/([^/]+)$/);
    if (adminForumCommentModMatch && method === "PATCH") {
      return await handleAdminForumModeration(
        decodeURIComponent(adminForumCommentModMatch[1]),
        request,
        decodeURIComponent(adminForumCommentModMatch[2])
      );
    }
    const adminForumModMatch = path.match(/^\/api\/v1\/admin\/forum\/([^/]+)\/moderate$/);
    if (adminForumModMatch && method === "PATCH") {
      return await handleAdminForumModeration(decodeURIComponent(adminForumModMatch[1]), request);
    }
    const adminResourceStateMatch = path.match(/^\/api\/v1\/admin\/([^/]+)\/([^/]+)\/state$/);
    if (adminResourceStateMatch && method === "PATCH") {
      return await handleAdminStateUpdate(
        decodeURIComponent(adminResourceStateMatch[1]),
        decodeURIComponent(adminResourceStateMatch[2]),
        request
      );
    }
    const adminResourceDetailMatch = path.match(/^\/api\/v1\/admin\/([^/]+)\/([^/]+)$/);
    if (adminResourceDetailMatch) {
      const resource = decodeURIComponent(adminResourceDetailMatch[1]);
      const id = decodeURIComponent(adminResourceDetailMatch[2]);
      if (method === "GET") {
        return await handleAdminGetRecord(resource, id, request);
      }
      if (method === "PUT") {
        return await handleAdminSaveRecord(resource, id, request);
      }
    }
    const adminResourceListMatch = path.match(/^\/api\/v1\/admin\/([^/]+)$/);
    if (adminResourceListMatch) {
      const resource = decodeURIComponent(adminResourceListMatch[1]);
      if (method === "GET") {
        return await handleAdminResourceList(resource, request, url);
      }
      if (method === "POST") {
        return await handleAdminSaveRecord(resource, "new", request);
      }
    }

    // If route under /api/v1/ not matched
    return new Response(
      JSON.stringify({ error: `Not found: ${method} ${path}` }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error(`[API V1 ROUTER ERROR] [${method} ${path}]:`, err);
    return new Response(
      JSON.stringify({ error: err?.message || "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
