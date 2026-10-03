import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import React, { useState } from "react";
import { AppLayout } from "@/components/mqulima/AppLayout";
import { OptimizedImage } from "@/components/ui/OptimizedImage";
import { 
  getBlogPostBySlug, 
  incrementBlogViewCount 
} from "@/lib/api/blog.server";
import { sanitizeHtml } from "@/lib/sanitization";
import { 
  ChevronRight, 
  Calendar, 
  Clock, 
  Share2, 
  Check, 
  ShieldCheck, 
  ShoppingBag, 
  Briefcase, 
  Calculator, 
  ArrowLeft,
  ArrowRight,
  Eye,
  BookOpen
} from "lucide-react";
import { toast } from "sonner";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { BlogDetailSkeleton } from "@/components/mqulima/RouteSkeletons";

export const Route = createFileRoute("/blog/$slug")({
  pendingComponent: BlogDetailSkeleton,
  pendingMs: 0,
  loader: async ({ params }) => {
    try {
      const post = await getBlogPostBySlug({ data: { slug: params.slug } });
      if (!post) {
        throw notFound();
      }
      return { post };
    } catch (e) {
      throw notFound();
    }
  },
  head: ({ loaderData }) => {
    const post = loaderData?.post;
    if (!post) {
      return {
        meta: [{ title: "Article Not Found | Mqulima News" }],
      };
    }

    const title = `${post.title} | Mqulima News`;
    const description = post.excerpt.length > 155 ? `${post.excerpt.slice(0, 152)}...` : post.excerpt;
    const url = `https://www.mqulima.com/blog/${post.slug}`;
    const image = post.coverImage.startsWith("http") 
      ? post.coverImage 
      : `https://www.mqulima.com${post.coverImage}`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": post.title,
      "description": description,
      "image": [image],
      "datePublished": post.publishedIso,
      "dateModified": post.updatedIso,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": url,
      },
      "author": {
        "@type": "Person",
        "name": post.author.name,
        "jobTitle": post.author.role,
        "description": post.author.bio,
      },
      "publisher": {
        "@type": "Organization",
        "name": "Mqulima",
        "url": "https://www.mqulima.com",
        "logo": {
          "@type": "ImageObject",
          "url": "https://www.mqulima.com/icon-192.png",
        },
      },
    };

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: post.title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
      ],
      links: [
        { rel: "canonical", href: url },
        ...(post.coverImage && !post.coverImage.startsWith("data:")
          ? [
              {
                rel: "preload",
                as: "image",
                href: post.coverImage,
                type: "image/webp",
                fetchPriority: "high",
              },
            ]
          : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(jsonLd),
        },
      ],
    };
  },
  component: BlogPostDetailRoute,
});

function BlogPostDetailRoute() {
  const { post } = Route.useLoaderData();
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    if (post?.id) {
      incrementBlogViewCount({ data: { postId: post.id } }).catch(() => {});
    }
  }, [post?.id]);

  if (!post) {
    return (
      <AppLayout>
        <div className="py-24 text-center max-w-md mx-auto px-4">
          <h1 className="text-2xl font-black text-[#1A3A1A]">Article Not Found</h1>
          <p className="text-sm text-slate-600 mt-2">The requested agricultural intelligence report could not be found.</p>
          <Link to="/blog" className="mt-6 inline-block px-5 py-2.5 bg-[#1A5438] text-white rounded-xl text-xs font-bold">
            Back to News
          </Link>
        </div>
      </AppLayout>
    );
  }

  const shareUrl = typeof window !== "undefined" ? window.location.href : `https://www.mqulima.com/blog/${post.slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Article link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled or unsupported
      }
    } else {
      handleCopyLink();
    }
  };

  const whatsappHref = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`;

  return (
    <AppLayout>
      <div className="bg-[#FAFBF9] min-h-screen text-[#1A261C] py-8 selection:bg-[#85CC14] selection:text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">

          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 flex-wrap">
            <Link to="/" className="hover:text-[#1A5438] transition">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Link to="/blog" className="hover:text-[#1A5438] transition">News</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="text-[#0F766E] truncate max-w-[200px] sm:max-w-xs">{post.category}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-8">
            <span className="inline-block bg-[#0F766E] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              {post.category}
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold font-['Lora',serif] text-[#1A3A1A] leading-tight tracking-tight">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 font-semibold mt-4 pb-6 border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-[#1A5438]" />
                {post.publishedAt}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-[#1A5438]" />
                {post.readTime}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-[#1A5438]" />
                {post.viewCount} views
              </span>
            </div>

            {/* Author E-E-A-T Profile Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 mt-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <OptimizedImage
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-[#1A5438]/20 shadow-xs shrink-0"
                  width={48}
                  height={48}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <strong className="text-sm font-bold text-[#1A3A1A]">{post.author.name}</strong>
                    <span className="bg-emerald-100 text-[#1A5438] text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                      Verified Author
                    </span>
                  </div>
                  <span className="text-xs text-slate-600 block">{post.author.role}</span>
                  <p className="text-[11px] text-slate-500 italic mt-0.5 max-w-md hidden sm:block">{post.author.bio}</p>
                </div>
              </div>

              {/* Verified Agronomist Review Badge */}
              <div className="bg-[#FAF9F5] border border-[#D4DDD0] rounded-xl px-3.5 py-2 text-left shrink-0">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#1A5438] uppercase tracking-wider">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Peer Reviewed</span>
                </div>
                <span className="text-[11px] font-semibold text-slate-700 block mt-0.5">
                  {post.reviewedBy}
                </span>
              </div>
            </div>
          </header>

          {/* Featured Hero Media */}
          <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 mb-8 border border-slate-200 shadow-sm">
            {post.mediaType === "video" ? (
              <video
                src={post.mediaUrl || post.coverImage}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <OptimizedImage
                src={post.coverImage}
                alt={post.title}
                priority={true}
                className="w-full h-full object-cover"
                width={1200}
                height={675}
                aspectRatio="16/9"
              />
            )}
          </div>

          {/* Social Share Bar */}
          <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-4 py-3 mb-8">
            <span className="text-xs font-bold text-slate-600">Share this intelligence:</span>
            <div className="flex items-center gap-2">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] text-white rounded-lg text-xs font-bold hover:brightness-105 transition"
              >
                <WhatsAppIcon className="h-4 w-4 fill-white" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={handleWebShare}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1A5438] text-white rounded-lg text-xs font-bold hover:bg-[#113B26] transition cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Share</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-200 transition cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <BookOpen className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied" : "Copy Link"}</span>
              </button>
            </div>
          </div>

          {/* Article HTML Body */}
          <div 
            className="prose prose-slate max-w-none text-[#263225] leading-relaxed text-sm sm:text-base space-y-5 font-['Open_Sans',sans-serif] [&_h2]:text-xl sm:[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:font-['Lora'] [&_h2]:text-[#1A3A1A] [&_h2]:mt-8 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-[#1A3A1A] [&_h3]:mt-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3 [&_li]:mb-1.5 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1A5438] [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:bg-[#E8F4F1]/40 [&_blockquote]:py-3 [&_blockquote]:rounded-r-lg [&_a]:text-[#0F766E] [&_a]:underline font-medium"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
          />

          {/* ══════════════════════════════════════════
              CONTENT-TO-COMMERCE LOOP EMBEDS
              ══════════════════════════════════════════ */}
          <section className="mt-12 pt-8 border-t-2 border-[#1A5438]/20 space-y-6">
            <h2 className="text-xl font-bold font-['Lora',serif] text-[#1A3A1A]">
              Recommended Next Actions for Your Farm
            </h2>

            <div className="grid gap-4 sm:grid-cols-3">
              {/* Embed 1: Related Product */}
              {post.relatedProduct && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-[#1A5438] transition">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#1A5438] mb-2">
                      <ShoppingBag className="h-3 w-3" />
                      AgroShop Input
                    </span>
                    <h3 className="text-xs font-bold text-[#1A3A1A] line-clamp-2">{post.relatedProduct.name}</h3>
                    <div className="text-xs font-black text-[#1A5438] mt-2">
                      KSh {post.relatedProduct.price.toLocaleString()}
                    </div>
                  </div>
                  <Link
                    to="/shop/product/$slug"
                    params={{ slug: post.relatedProduct.slug }}
                    className="mt-4 w-full py-2 bg-[#F5A623] hover:bg-[#E0951F] text-[#1A3A1A] font-bold text-xs rounded-xl text-center transition"
                  >
                    View in AgroShop →
                  </Link>
                </div>
              )}

              {/* Embed 2: Related Service */}
              {post.relatedService && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-[#1A5438] transition">
                  <div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#0F766E] mb-2">
                      <Briefcase className="h-3 w-3" />
                      Book Expert
                    </span>
                    <h3 className="text-xs font-bold text-[#1A3A1A] line-clamp-2">{post.relatedService.name}</h3>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{post.relatedService.description}</p>
                  </div>
                  <Link
                    to="/services"
                    className="mt-4 w-full py-2 bg-[#1A5438] hover:bg-[#113B26] text-white font-bold text-xs rounded-xl text-center transition"
                  >
                    Book Consultation →
                  </Link>
                </div>
              )}

              {/* Embed 3: Tool Calculator */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between shadow-xs hover:border-[#1A5438] transition">
                <div>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[#85CC14] mb-2">
                    <Calculator className="h-3 w-3" />
                    Precision Tool
                  </span>
                  <h3 className="text-xs font-bold text-[#1A3A1A] line-clamp-2">{post.relatedTool.title}</h3>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{post.relatedTool.description}</p>
                </div>
                <Link
                  to="/tools"
                  className="mt-4 w-full py-2 bg-[#85CC14] hover:bg-[#74B510] text-[#0B2117] font-bold text-xs rounded-xl text-center transition"
                >
                  Launch Tool →
                </Link>
              </div>
            </div>
          </section>

          {/* Related Articles */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <section className="mt-12 pt-8 border-t border-slate-200">
              <h2 className="text-xl font-bold font-['Lora',serif] text-[#1A3A1A] mb-6">
                Related Agricultural Intelligence
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                {post.relatedPosts.map((r: any) => (
                  <Link
                    key={r.id}
                    to="/blog/$slug"
                    params={{ slug: r.slug }}
                    preload="intent"
                    className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-[#1A5438] hover:shadow-md transition flex flex-col content-auto-card"
                  >
                    <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                      <OptimizedImage
                        src={r.coverImage}
                        alt={r.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        width={400}
                        height={250}
                        aspectRatio="16/10"
                      />
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-bold text-[#0F766E] uppercase block mb-1">{r.category}</span>
                        <h3 className="text-xs font-bold font-['Lora',serif] text-[#1A3A1A] group-hover:text-[#1A5438] transition line-clamp-2 leading-snug">
                          {r.title}
                        </h3>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-3 block">{r.publishedAt}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Back to Blog */}
          <div className="mt-12 text-center">
            <Link
              to="/blog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to all News & Insights</span>
            </Link>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
