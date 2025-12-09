import React, { useState, useEffect, useRef } from "react";
import { API_URL } from "../utils/api";
import { createPortal } from "react-dom";
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

const CommunityPage = ({ onBack, onNavigateToProfile }) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState("for-you"); // 'following', 'trending', 'for-you'
  const [postFilter, setPostFilter] = useState("all"); // 'all', 'photos', 'questions'
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [posts, setPosts] = useState([]);
  const [trendingTopics, setTrendingTopics] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostImages, setNewPostImages] = useState([]);
  const [postType, setPostType] = useState("post");
  const [selectedPost, setSelectedPost] = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [expandedImage, setExpandedImage] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [editPostContent, setEditPostContent] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState("");
  const [openPostMenu, setOpenPostMenu] = useState(null);
  const [openCommentMenu, setOpenCommentMenu] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const photoInputRef = useRef(null);

  const API_BASE = `${API_URL}/api/community`;

  // Fetch posts from API
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const type = postFilter === "all" ? "" : postFilter;
      const url = `${API_BASE}/posts?${type ? `type=${type}&` : ""}limit=50`;

      const headers = {};
      if (user?.id) {
        headers["x-user-id"] = user.id;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Failed to fetch posts");

      const result = await response.json();
      if (result.success) {
        // Convert createdAt strings to Date objects
        const postsWithDates = result.data.map((post) => ({
          ...post,
          createdAt: new Date(post.createdAt),
        }));
        setPosts(postsWithDates);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trending topics and suggested users
  const fetchCommunityData = async () => {
    try {
      const headers = {};
      if (user?.id) {
        headers["x-user-id"] = user.id;
      }

      // Fetch trending topics
      const topicsResponse = await fetch(`${API_BASE}/topics/trending`, {
        headers,
      });
      if (topicsResponse.ok) {
        const topicsResult = await topicsResponse.json();
        if (topicsResult.success) {
          setTrendingTopics(topicsResult.data);
        }
      }

      // Fetch suggested users
      const usersResponse = await fetch(`${API_BASE}/users/suggested?limit=5`, {
        headers,
      });
      if (usersResponse.ok) {
        const usersResult = await usersResponse.json();
        if (usersResult.success) {
          setSuggestedUsers(usersResult.data);
        }
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  // Load posts from API on mount and when filter changes
  useEffect(() => {
    fetchPosts();
    fetchCommunityData();
  }, [postFilter, user?.id]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openPostMenu && !event.target.closest(".post-menu-container")) {
        setOpenPostMenu(null);
      }
      if (openCommentMenu && !event.target.closest(".comment-menu-container")) {
        setOpenCommentMenu(null);
      }
      if (showFabMenu && !event.target.closest(".fab-container")) {
        setShowFabMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openPostMenu, openCommentMenu, showFabMenu]);

  const formatTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && newPostImages.length === 0) return;
    if (!user?.id) {
      alert("Please log in to create a post");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          content: newPostContent,
          type: postType,
          images: newPostImages,
          tags: [],
        }),
      });

      if (!response.ok) throw new Error("Failed to create post");

      const result = await response.json();
      if (result.success) {
        // Convert createdAt to Date
        const newPost = {
          ...result.data,
          createdAt: new Date(result.data.createdAt),
        };
        setPosts([newPost, ...posts]);
        setNewPostContent("");
        setNewPostImages([]);
        setShowCreatePost(false);
        setPostType("post");
      }
    } catch (error) {
      console.error("Error creating post:", error);
      alert("Failed to create post. Please try again.");
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + newPostImages.length > 4) {
      alert("Maximum 4 images per post");
      return;
    }
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewPostImages((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleLike = async (postId) => {
    if (!user?.id) {
      alert("Please log in to like posts");
      return;
    }

    try {
      // Optimistically update UI
      const updatedPosts = posts.map((post) => {
        if (post.id === postId) {
          return {
            ...post,
            liked: !post.liked,
            likes: post.liked ? post.likes - 1 : post.likes + 1,
          };
        }
        return post;
      });
      setPosts(updatedPosts);

      const response = await fetch(`${API_BASE}/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (!response.ok) throw new Error("Failed to toggle like");

      const result = await response.json();
      if (result.success) {
        // Refresh posts to get accurate counts
        fetchPosts();
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      // Revert optimistic update
      fetchPosts();
    }
  };

  const handleFollow = async (userId) => {
    if (!user?.id) {
      alert("Please log in to follow users");
      return;
    }

    try {
      // Optimistically update UI
      setPosts(
        posts.map((post) => {
          if (post.author.id === userId) {
            return {
              ...post,
              author: {
                ...post.author,
                isFollowing: !post.author.isFollowing,
                followers: post.author.isFollowing
                  ? post.author.followers - 1
                  : post.author.followers + 1,
              },
            };
          }
          return post;
        })
      );

      setSuggestedUsers(
        suggestedUsers.map((suggestedUser) => {
          if (suggestedUser.id === userId) {
            return {
              ...suggestedUser,
              isFollowing: !suggestedUser.isFollowing,
              followers: suggestedUser.isFollowing
                ? suggestedUser.followers - 1
                : suggestedUser.followers + 1,
            };
          }
          return suggestedUser;
        })
      );

      const response = await fetch(`${API_BASE}/users/${userId}/follow`, {
        method: "POST",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (!response.ok) throw new Error("Failed to toggle follow");
    } catch (error) {
      console.error("Error toggling follow:", error);
      // Revert by refreshing
      fetchPosts();
      fetchCommunityData();
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    if (!user?.id) {
      alert("Please log in to comment");
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/posts/${selectedPost.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": user.id,
          },
          body: JSON.stringify({
            content: commentText.trim(),
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to add comment");

      const result = await response.json();
      if (result.success) {
        // Refresh posts to get updated comment
        await fetchPosts();
        // Update selected post with fresh data
        const postResponse = await fetch(
          `${API_BASE}/posts/${selectedPost.id}`,
          {
            headers: user?.id ? { "x-user-id": user.id } : {},
          }
        );
        if (postResponse.ok) {
          const postResult = await postResponse.json();
          if (postResult.success) {
            setSelectedPost({
              ...postResult.data,
              createdAt: new Date(postResult.data.createdAt),
            });
          }
        }
        setCommentText("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  };

  const handleFlagPost = (postId) => {
    if (window.confirm("Flag this post as inappropriate?")) {
      // In a real app, this would send to a backend
      console.log("Post flagged:", postId);
      alert("Thank you for reporting. Our team will review this post.");
      setOpenPostMenu(null);
    }
  };

  const handleFlagComment = (postId, commentId) => {
    if (window.confirm("Flag this comment as inappropriate?")) {
      // In a real app, this would send to a backend
      console.log("Comment flagged:", postId, commentId);
      alert("Thank you for reporting. Our team will review this comment.");
      setOpenCommentMenu(null);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (!response.ok) throw new Error("Failed to delete post");

      setPosts(posts.filter((post) => post.id !== postId));
      if (selectedPost?.id === postId) {
        setShowComments(false);
        setSelectedPost(null);
      }
      setOpenPostMenu(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      alert("Failed to delete post. Please try again.");
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "x-user-id": user.id,
        },
      });

      if (!response.ok) throw new Error("Failed to delete comment");

      // Refresh posts to get updated comment count
      await fetchPosts();
      // Update selected post
      const postResponse = await fetch(`${API_BASE}/posts/${postId}`, {
        headers: user?.id ? { "x-user-id": user.id } : {},
      });
      if (postResponse.ok) {
        const postResult = await postResponse.json();
        if (postResult.success) {
          setSelectedPost({
            ...postResult.data,
            createdAt: new Date(postResult.data.createdAt),
          });
        }
      }
      setOpenCommentMenu(null);
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Failed to delete comment. Please try again.");
    }
  };

  const handleStartEditPost = (post) => {
    setEditingPost(post.id);
    setEditPostContent(post.content);
    setOpenPostMenu(null);
  };

  const handleSaveEditPost = async (postId) => {
    if (!editPostContent.trim()) return;
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/posts/${postId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          content: editPostContent.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update post");

      // Refresh posts
      await fetchPosts();
      setEditingPost(null);
      setEditPostContent("");
    } catch (error) {
      console.error("Error updating post:", error);
      alert("Failed to update post. Please try again.");
    }
  };

  const handleCancelEditPost = () => {
    setEditingPost(null);
    setEditPostContent("");
  };

  const handleStartEditComment = (comment) => {
    setEditingComment(comment.id);
    setEditCommentContent(comment.content);
    setOpenCommentMenu(null);
  };

  const handleSaveEditComment = async (postId, commentId) => {
    if (!editCommentContent.trim()) return;
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user.id,
        },
        body: JSON.stringify({
          content: editCommentContent.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to update comment");

      // Refresh posts and selected post
      await fetchPosts();
      const postResponse = await fetch(`${API_BASE}/posts/${postId}`, {
        headers: user?.id ? { "x-user-id": user.id } : {},
      });
      if (postResponse.ok) {
        const postResult = await postResponse.json();
        if (postResult.success) {
          setSelectedPost({
            ...postResult.data,
            createdAt: new Date(postResult.data.createdAt),
          });
        }
      }
      setEditingComment(null);
      setEditCommentContent("");
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Failed to update comment. Please try again.");
    }
  };

  const handleCancelEditComment = () => {
    setEditingComment(null);
    setEditCommentContent("");
  };

  const isCurrentUser = (authorId) => {
    return user?.id === authorId;
  };

  const filteredPosts = posts.filter((post) => {
    const matchesFilter =
      postFilter === "all" ||
      (postFilter === "photos" && post.type === "photo") ||
      (postFilter === "questions" && post.type === "question");

    const matchesSearch =
      !searchQuery ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark ? "bg-background" : "bg-[#fafafa]"
        }`}
        style={{
          background: isDark
            ? "linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)"
            : "linear-gradient(135deg, #fafafa 0%, #e4e5f1 50%, rgba(104, 101, 231, 0.1) 100%)",
        }}
      >
        <div
          className={`text-xl ${isDark ? "text-white" : "text-theme-primary"}`}
        >
          Loading community...
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-all duration-300 ease-in-out relative ${
        isDark ? "text-white" : "text-theme-primary"
      }`}
      style={{
        height: "100vh",
        overflowY: "auto",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        position: "relative",
        background: isDark
          ? "linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)"
          : "linear-gradient(135deg, #fafafa 0%, #e4e5f1 50%, rgba(104, 101, 231, 0.1) 100%)",
      }}
    >
      {/* Header */}
      <div className="dark:bg-black/20 bg-[#fafafa]/95 backdrop-blur-sm dark:border-b border-b border-[#d2d3db] sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center flex-1">
            <button
              onClick={onBack}
              className="w-10 h-10 dark:bg-white/10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center dark:hover:bg-white/20 hover:bg-white/30 transition-all duration-200 dark:border-white/20 border-[#d2d3db] border"
            >
              <svg
                className="w-5 h-5 dark:text-white text-theme-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-10 h-10 dark:bg-white/10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center dark:hover:bg-white/20 hover:bg-white/30 transition-all duration-200 dark:border-white/20 border-[#d2d3db] border"
            >
              <svg
                className="w-5 h-5 dark:text-white text-theme-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search posts, users, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full dark:bg-white/10 bg-white/20 backdrop-blur-md dark:border-white/20 border-[#d2d3db] border rounded-lg px-4 py-2 pl-10 dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 dark:text-gray-400 text-theme-secondary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center px-4 pb-2 dark:border-b border-b border-[#d2d3db] border-white/10">
          <button
            onClick={() => setActiveTab("for-you")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative text-center ${
              activeTab === "for-you"
                ? "dark:text-white text-theme-primary"
                : "dark:text-gray-400 dark:hover:text-white text-theme-secondary hover:text-theme-primary"
            }`}
          >
            For You
            {activeTab === "for-you" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("trending")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative text-center ${
              activeTab === "trending"
                ? "dark:text-white text-theme-primary"
                : "dark:text-gray-400 dark:hover:text-white text-theme-secondary hover:text-theme-primary"
            }`}
          >
            Trending
            {activeTab === "trending" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab("following")}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors relative text-center ${
              activeTab === "following"
                ? "dark:text-white text-theme-primary"
                : "dark:text-gray-400 dark:hover:text-white text-theme-secondary hover:text-theme-primary"
            }`}
          >
            Following
            {activeTab === "following" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            )}
          </button>
        </div>

        {/* Post Filters */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setPostFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              postFilter === "all"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                : "dark:bg-white/10 bg-white/20 dark:text-gray-300 text-theme-primary dark:hover:bg-white/20 hover:bg-white/30"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setPostFilter("photos")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              postFilter === "photos"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                : "dark:bg-white/10 bg-white/20 dark:text-gray-300 text-theme-primary dark:hover:bg-white/20 hover:bg-white/30"
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setPostFilter("questions")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              postFilter === "questions"
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
                : "dark:bg-white/10 bg-white/20 dark:text-gray-300 text-theme-primary dark:hover:bg-white/20 hover:bg-white/30"
            }`}
          >
            Questions
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-24">
        <div className="max-w-4xl mx-auto">
          {/* Trending Topics Section - Only show on For You tab */}
          {activeTab === "for-you" && trendingTopics.length > 0 && (
            <div className="mb-6 dark:bg-white/5 bg-white/20 backdrop-blur-sm rounded-xl p-4 dark:border-white/10 border-[#d2d3db] border">
              <h3 className="dark:text-white text-theme-primary font-semibold mb-3 flex items-center gap-2">
                <svg
                  className="w-5 h-5 dark:text-blue-400 text-[#6865E7]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
                Trending Topics
              </h3>
              <div className="flex flex-wrap gap-2">
                {trendingTopics.slice(0, 5).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => setSearchQuery(topic.name)}
                    className="px-3 py-1.5 dark:bg-white/10 bg-white/30 dark:hover:bg-white/20 hover:bg-white/40 rounded-full text-sm dark:text-gray-300 dark:hover:text-white text-theme-primary hover:text-[#6865E7] transition-colors flex items-center gap-2"
                  >
                    <span>#{topic.name}</span>
                    <span className="text-xs dark:text-gray-500 text-theme-tertiary">
                      {formatNumber(topic.posts)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Users - Only show on For You tab */}
          {activeTab === "for-you" && suggestedUsers.length > 0 && (
            <div className="mb-6 dark:bg-white/5 bg-white/20 backdrop-blur-sm rounded-xl p-4 dark:border-white/10 border-[#d2d3db] border">
              <h3 className="dark:text-white text-theme-primary font-semibold mb-3">
                Suggested Users
              </h3>
              <div className="space-y-3">
                {suggestedUsers.map((suggestedUser) => (
                  <div
                    key={suggestedUser.id}
                    className="flex items-center justify-between"
                  >
                    <button
                      onClick={() =>
                        onNavigateToProfile &&
                        onNavigateToProfile(suggestedUser.id)
                      }
                      className="flex items-center gap-3 flex-1 text-left hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {suggestedUser.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="dark:text-white text-theme-primary font-semibold">
                          {suggestedUser.name}
                        </p>
                        <p className="dark:text-gray-400 text-theme-secondary text-xs">
                          {suggestedUser.username}
                        </p>
                        <p className="dark:text-gray-500 text-theme-tertiary text-xs">
                          {formatNumber(suggestedUser.followers)} followers
                        </p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleFollow(suggestedUser.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        suggestedUser.isFollowing
                          ? "dark:bg-white/10 bg-white/30 dark:text-gray-300 text-theme-primary dark:hover:bg-white/20 hover:bg-white/40"
                          : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                      }`}
                    >
                      {suggestedUser.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posts Feed */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <p className="dark:text-gray-400 text-theme-secondary text-lg">
                No posts found
              </p>
              <p className="dark:text-gray-500 text-theme-tertiary text-sm mt-2">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Be the first to share something!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <div
                  key={post.id}
                  className="dark:bg-white/5 bg-white/20 backdrop-blur-sm rounded-xl p-4 dark:border-white/10 border-[#d2d3db] border dark:hover:border-white/20 hover:border-[#9394a5] transition-all"
                >
                  {/* Post Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <button
                      onClick={() =>
                        onNavigateToProfile &&
                        onNavigateToProfile(post.author.id)
                      }
                      className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className="text-white font-bold text-lg">
                        {post.author.name.charAt(0).toUpperCase()}
                      </span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <button
                          onClick={() =>
                            onNavigateToProfile &&
                            onNavigateToProfile(post.author.id)
                          }
                          className="dark:text-white text-theme-primary font-semibold dark:hover:text-blue-400 hover:text-[#6865E7] transition-colors cursor-pointer"
                        >
                          {post.author.name}
                        </button>
                        <button
                          onClick={() =>
                            onNavigateToProfile &&
                            onNavigateToProfile(post.author.id)
                          }
                          className="dark:text-gray-400 text-theme-secondary text-xs dark:hover:text-gray-300 hover:text-theme-primary transition-colors cursor-pointer"
                        >
                          {post.author.username}
                        </button>
                        {post.type === "question" && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                            Question
                          </span>
                        )}
                        {post.type === "photo" && (
                          <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                            Photo
                          </span>
                        )}
                      </div>
                      <p className="dark:text-gray-400 text-theme-secondary text-xs">
                        {formatTimeAgo(post.createdAt)}
                      </p>
                      {post.author.followers > 0 && (
                        <p className="dark:text-gray-500 text-theme-tertiary text-xs mt-1">
                          {formatNumber(post.author.followers)} followers
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {!isCurrentUser(post.author.id) && (
                        <button
                          onClick={() => handleFollow(post.author.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            post.author.isFollowing
                              ? "dark:bg-white/10 bg-white/30 dark:text-gray-300 text-theme-primary dark:hover:bg-white/20 hover:bg-white/40"
                              : "bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700"
                          }`}
                        >
                          {post.author.isFollowing ? "Following" : "Follow"}
                        </button>
                      )}
                      {/* Post Menu */}
                      <div className="relative post-menu-container">
                        <button
                          onClick={() =>
                            setOpenPostMenu(
                              openPostMenu === post.id ? null : post.id
                            )
                          }
                          className="p-2 dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary transition-colors"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                          </svg>
                        </button>
                        {openPostMenu === post.id && (
                          <div className="absolute right-0 top-10 dark:bg-gray-800 bg-white dark:border-white/10 border-[#d2d3db] border rounded-lg shadow-xl min-w-[160px] z-50">
                            {isCurrentUser(post.author.id) ? (
                              <>
                                <button
                                  onClick={() => handleStartEditPost(post)}
                                  className="w-full px-4 py-2 text-left text-sm dark:text-white text-theme-primary dark:hover:bg-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePost(post.id)}
                                  className="w-full px-4 py-2 text-left text-sm text-red-400 dark:hover:bg-gray-700 hover:bg-red-50 transition-colors flex items-center gap-2"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                  </svg>
                                  Delete
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleFlagPost(post.id)}
                                className="w-full px-4 py-2 text-left text-sm text-red-400 dark:hover:bg-gray-700 hover:bg-red-50 transition-colors flex items-center gap-2"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                Flag
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  {editingPost === post.id ? (
                    <div className="mb-3">
                      <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="w-full dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg p-3 dark:text-white text-theme-primary resize-none mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        rows="3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEditPost(post.id)}
                          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditPost}
                          className="px-4 py-2 dark:bg-gray-700 bg-gray-200 dark:text-white text-theme-primary rounded-lg text-sm font-medium dark:hover:bg-gray-600 hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="dark:text-white text-theme-primary mb-3 leading-relaxed">
                      {post.content}
                    </p>
                  )}

                  {/* Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {post.tags.map((tag, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSearchQuery(tag)}
                          className="dark:text-blue-400 text-[#6865E7] dark:hover:text-blue-300 hover:text-[#4F46E5] text-sm"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div
                      className={`grid gap-2 mb-3 rounded-lg overflow-hidden ${
                        post.images.length === 1 ? "grid-cols-1" : "grid-cols-2"
                      }`}
                    >
                      {post.images.map((img, idx) => (
                        <div
                          key={idx}
                          className="relative w-full h-64 rounded-lg overflow-hidden cursor-pointer"
                          onClick={() => setExpandedImage(img)}
                        >
                          {/* Blurred, darkened, zoomed background */}
                          <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${img})`,
                              backgroundSize: "150%",
                              backgroundPosition: "center",
                              filter: "blur(20px) brightness(0.3)",
                              transform: "scale(1.1)",
                            }}
                          />
                          {/* Main image */}
                          <img
                            src={img}
                            alt={`Post ${post.id} image ${idx}`}
                            className="relative w-full h-full object-contain z-10"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Post Stats */}
                  <div className="flex items-center gap-4 text-sm dark:text-gray-400 text-theme-secondary mb-3">
                    <span>{formatNumber(post.likes)} likes</span>
                    <span>{formatNumber(post.comments)} comments</span>
                    <span>{formatNumber(post.shares)} shares</span>
                  </div>

                  {/* Post Actions */}
                  <div className="flex items-center gap-4 pt-3 dark:border-t border-t border-[#d2d3db] border-white/10">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-colors ${
                        post.liked
                          ? "text-red-400"
                          : "dark:text-gray-400 text-theme-secondary dark:hover:text-red-400 hover:text-red-500"
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        fill={post.liked ? "currentColor" : "none"}
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      <span className="text-sm">Like</span>
                    </button>
                    <button
                      onClick={async () => {
                        // Fetch full post data with comments
                        try {
                          const headers = {};
                          if (user?.id) {
                            headers["x-user-id"] = user.id;
                          }
                          const response = await fetch(
                            `${API_BASE}/posts/${post.id}`,
                            { headers }
                          );
                          if (response.ok) {
                            const result = await response.json();
                            if (result.success) {
                              setSelectedPost({
                                ...result.data,
                                createdAt: new Date(result.data.createdAt),
                              });
                              setShowComments(true);
                            }
                          } else {
                            setSelectedPost(post);
                            setShowComments(true);
                          }
                        } catch (error) {
                          console.error("Error fetching post details:", error);
                          setSelectedPost(post);
                          setShowComments(true);
                        }
                      }}
                      className="flex items-center gap-2 dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span className="text-sm">Comment</span>
                    </button>
                    <button className="flex items-center gap-2 dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary transition-colors ml-auto">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                        />
                      </svg>
                      <span className="text-sm">Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreatePost &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100500] flex items-center justify-center p-4"
            onClick={() => {
              setShowCreatePost(false);
              setNewPostContent("");
              setNewPostImages([]);
              setPostType("post");
            }}
          >
            <div
              className="bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-white">Create Post</h2>
                  <button
                    onClick={() => {
                      setShowCreatePost(false);
                      setNewPostContent("");
                      setNewPostImages([]);
                      setPostType("post");
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Content Input */}
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={
                    postType === "question"
                      ? "Ask a question..."
                      : "What's on your mind?"
                  }
                  className="w-full bg-gray-700 rounded-lg p-4 text-white placeholder-gray-400 resize-none mb-4 min-h-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />

                {/* Image Preview */}
                {newPostImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {newPostImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img}
                          alt={`Preview ${idx}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() =>
                            setNewPostImages(
                              newPostImages.filter((_, i) => i !== idx)
                            )
                          }
                          className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Image Upload - Defaults to Camera, allows gallery access */}
                <div className="mb-4">
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-600 transition-colors">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-white text-sm">Add Photos</span>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleCreatePost}
                  disabled={
                    !newPostContent.trim() && newPostImages.length === 0
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg py-3 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
                >
                  {postType === "question" ? "Ask Question" : "Post"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Comments Modal */}
      {showComments &&
        selectedPost &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100500] flex items-end"
            onClick={() => {
              setShowComments(false);
              setSelectedPost(null);
              setCommentText("");
            }}
          >
            <div
              className="bg-gray-800 rounded-t-2xl w-full max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Comments</h3>
                <button
                  onClick={() => {
                    setShowComments(false);
                    setSelectedPost(null);
                    setCommentText("");
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {(() => {
                  const currentPost = posts.find(
                    (p) => p.id === selectedPost.id
                  );
                  const commentsList = currentPost?.commentsList || [];

                  if (commentsList.length === 0) {
                    return (
                      <div className="text-center text-gray-400 py-8">
                        <p>No comments yet. Be the first to comment!</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {commentsList.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <button
                            onClick={() =>
                              onNavigateToProfile &&
                              onNavigateToProfile(comment.author.id)
                            }
                            className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                          >
                            <span className="text-white text-sm font-medium">
                              {comment.author.name.charAt(0).toUpperCase()}
                            </span>
                          </button>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <button
                                onClick={() =>
                                  onNavigateToProfile &&
                                  onNavigateToProfile(comment.author.id)
                                }
                                className="text-white font-medium text-sm hover:text-blue-400 transition-colors cursor-pointer"
                              >
                                {comment.author.name}
                              </button>
                              <span className="text-gray-400 text-xs">
                                {formatTimeAgo(comment.createdAt)}
                              </span>
                              {/* Comment Menu */}
                              <div className="relative ml-auto comment-menu-container">
                                <button
                                  onClick={() =>
                                    setOpenCommentMenu(
                                      openCommentMenu === comment.id
                                        ? null
                                        : comment.id
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth="2"
                                      d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                    />
                                  </svg>
                                </button>
                                {openCommentMenu === comment.id && (
                                  <div className="absolute right-0 top-6 bg-gray-800 border border-white/10 rounded-lg shadow-xl min-w-[160px] z-50">
                                    {isCurrentUser(comment.author.id) ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleStartEditComment(comment)
                                          }
                                          className="w-full px-4 py-2 text-left text-sm text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                            />
                                          </svg>
                                          Edit
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteComment(
                                              selectedPost.id,
                                              comment.id
                                            )
                                          }
                                          className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                                        >
                                          <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                          >
                                            <path
                                              strokeLinecap="round"
                                              strokeLinejoin="round"
                                              strokeWidth="2"
                                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                            />
                                          </svg>
                                          Delete
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() =>
                                          handleFlagComment(
                                            selectedPost.id,
                                            comment.id
                                          )
                                        }
                                        className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-2"
                                      >
                                        <svg
                                          className="w-4 h-4"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                          />
                                        </svg>
                                        Flag
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {editingComment === comment.id ? (
                              <div>
                                <textarea
                                  value={editCommentContent}
                                  onChange={(e) =>
                                    setEditCommentContent(e.target.value)
                                  }
                                  className="w-full bg-gray-700 rounded-lg p-2 text-white text-sm resize-none mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                  rows="2"
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleSaveEditComment(
                                        selectedPost.id,
                                        comment.id
                                      )
                                    }
                                    className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded text-xs font-medium hover:from-blue-600 hover:to-indigo-700 transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={handleCancelEditComment}
                                    className="px-3 py-1 bg-gray-700 text-white rounded text-xs font-medium hover:bg-gray-600 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-300 text-sm">
                                {comment.content}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleAddComment();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!commentText.trim()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Expanded Image Modal */}
      {expandedImage &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/90 z-[100500]"
            onClick={() => setExpandedImage(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setExpandedImage(null)}
              className="fixed right-4 top-20 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-[100501]"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Expanded Image */}
            <div
              className="flex items-center justify-center h-full p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={expandedImage}
                alt="Expanded post image"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            </div>
          </div>,
          document.body
        )}

      {/* Floating Action Button (FAB) */}
      <div className="fab-container fixed bottom-24 sm:bottom-28 right-6 z-[100400]">
        {/* FAB Submenu */}
        {showFabMenu && (
          <div className="absolute bottom-20 right-0 mb-2 flex flex-col gap-3 animate-in fade-in-0 slide-in-from-bottom-4">
            {/* Post Option */}
            <button
              onClick={() => {
                setPostType("post");
                setShowCreatePost(true);
                setShowFabMenu(false);
              }}
              className="flex items-center gap-3 px-4 py-3 bg-gray-800 dark:bg-white/10 backdrop-blur-md rounded-full text-white dark:text-white shadow-lg hover:bg-gray-700 dark:hover:bg-white/20 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Post</span>
            </button>

            {/* Question Option */}
            <button
              onClick={() => {
                setPostType("question");
                setShowCreatePost(true);
                setShowFabMenu(false);
              }}
              className="flex items-center gap-3 px-4 py-3 bg-gray-800 dark:bg-white/10 backdrop-blur-md rounded-full text-white dark:text-white shadow-lg hover:bg-gray-700 dark:hover:bg-white/20 transition-all duration-200"
            >
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-sm font-medium">Question</span>
            </button>
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all duration-300 ${
            showFabMenu ? "rotate-45" : ""
          }`}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CommunityPage;
