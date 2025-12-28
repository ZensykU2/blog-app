// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { relations, sql } from "drizzle-orm";
import {
  index,
  pgEnum,
  pgTableCreator,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `blog-app_${name}`);

// ============ ENUMS ============
export const userRoleEnum = pgEnum("user_role", ["admin", "author", "user"]);
export const postStatusEnum = pgEnum("post_status", ["draft", "published", "archived"]);
export const commentStatusEnum = pgEnum("comment_status", ["pending", "approved", "rejected"]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "new_follower",
  "new_comment",
  "comment_like",
  "post_like",
  "post_featured",
  "mention",
]);
export const reportStatusEnum = pgEnum("report_status", ["pending", "reviewed", "resolved"]);
export const reportTypeEnum = pgEnum("report_type", ["spam", "inappropriate", "harassment", "other"]);

// ============ USERS ============
export const users = createTable(
  "user",
  (d) => ({
    id: d.varchar({ length: 255 }).notNull().primaryKey(),
    name: d.varchar({ length: 255 }),
    email: d.varchar({ length: 255 }).notNull(),
    emailVerified: d.timestamp({ withTimezone: true, mode: "date" }),
    image: d.text(),
    password: d.varchar({ length: 255 }), // For email/password auth (hashed)
    clerkId: d.varchar({ length: 255 }).unique(), // Made optional for migration
    username: d.varchar({ length: 50 }).unique(),
    displayName: d.varchar({ length: 100 }),
    bio: d.text(),
    profileImage: d.text(),
    bannerImage: d.text(),
    role: userRoleEnum().default("user").notNull(),
    trustScore: d.integer().default(0).notNull(),
    isVerified: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("user_username_idx").on(t.username),
    index("user_email_idx").on(t.email),
  ]
);

// ============ AUTH.JS TABLES ============
export const accounts = createTable(
  "account",
  (d) => ({
    userId: d.varchar({ length: 255 }).notNull(),
    type: d.varchar({ length: 255 }).notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ]
);

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ withTimezone: true, mode: "date" }).notNull(),
  }),
  (t) => [
    index("session_user_id_idx").on(t.userId),
  ]
);

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ withTimezone: true, mode: "date" }).notNull(),
  }),
  (t) => [
    primaryKey({ columns: [t.identifier, t.token] }),
  ]
);

// ============ USER SOCIAL LINKS ============
export const userSocialLinks = createTable("user_social_link", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d.varchar({ length: 255 }).notNull(),
  platform: d.varchar({ length: 50 }).notNull(),
  url: d.text().notNull(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

// ============ EMAIL PREFERENCES ============
export const emailPreferences = createTable("email_preference", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  userId: d.varchar({ length: 255 }).notNull(),
  newFollowers: d.boolean().default(true).notNull(),
  newComments: d.boolean().default(true).notNull(),
  postLikes: d.boolean().default(true).notNull(),
  weeklyDigest: d.boolean().default(true).notNull(),
  marketingEmails: d.boolean().default(false).notNull(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// ============ CATEGORIES ============
export const categories = createTable("category", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 100 }).notNull().unique(),
  slug: d.varchar({ length: 100 }).notNull().unique(),
  description: d.text(),
  color: d.varchar({ length: 7 }), // hex color
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

// ============ TAGS ============
export const tags = createTable("tag", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  name: d.varchar({ length: 50 }).notNull().unique(),
  slug: d.varchar({ length: 50 }).notNull().unique(),
  description: d.text(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

// ============ POST SERIES ============
export const postSeries = createTable("post_series", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  title: d.varchar({ length: 255 }).notNull(),
  slug: d.varchar({ length: 255 }).notNull().unique(),
  description: d.text(),
  authorId: d.varchar({ length: 255 }).notNull(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

// ============ POSTS ============
export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    title: d.varchar({ length: 255 }).notNull(),
    slug: d.varchar({ length: 255 }).notNull().unique(),
    content: d.text().notNull(),
    excerpt: d.text(),
    featuredImage: d.text(),
    readingTime: d.integer(), // in minutes
    wordCount: d.integer().default(0),
    status: postStatusEnum().default("draft").notNull(),
    isFeatured: d.boolean().default(false).notNull(),
    authorId: d.varchar({ length: 255 }).notNull(),
    categoryId: d.integer(),
    seriesId: d.integer(),
    seriesOrder: d.integer(),
    publishedAt: d.timestamp({ withTimezone: true }),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("post_author_id_idx").on(t.authorId),
    index("post_status_idx").on(t.status),
    index("post_slug_idx").on(t.slug),
    index("post_featured_idx").on(t.isFeatured),
    index("post_published_at_idx").on(t.publishedAt),
  ]
);

// ============ POST TAGS (Many-to-Many) ============
export const postTags = createTable(
  "post_tag",
  (d) => ({
    postId: d.integer().notNull(),
    tagId: d.integer().notNull(),
  }),
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })]
);

// ============ POST VIEWS ============
export const postViews = createTable("post_view", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  postId: d.integer().notNull(),
  userId: d.varchar({ length: 255 }), // null for anonymous
  ipAddress: d.varchar({ length: 45 }),
  userAgent: d.text(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

// ============ POST LIKES ============
export const postLikes = createTable(
  "post_like",
  (d) => ({
    postId: d.integer().notNull(),
    userId: d.varchar({ length: 255 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.postId, t.userId] })]
);

// ============ POST BOOKMARKS ============
export const postBookmarks = createTable(
  "post_bookmark",
  (d) => ({
    postId: d.integer().notNull(),
    userId: d.varchar({ length: 255 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.postId, t.userId] })]
);

// ============ COMMENTS ============
export const comments = createTable(
  "comment",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    content: d.text().notNull(),
    postId: d.integer().notNull(),
    authorId: d.varchar({ length: 255 }).notNull(),
    parentId: d.integer(), // for nested comments
    status: commentStatusEnum().default("pending").notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("comment_post_id_idx").on(t.postId),
    index("comment_author_id_idx").on(t.authorId),
    index("comment_parent_id_idx").on(t.parentId),
    index("comment_status_idx").on(t.status),
  ]
);

// ============ COMMENT LIKES ============
export const commentLikes = createTable(
  "comment_like",
  (d) => ({
    commentId: d.integer().notNull(),
    userId: d.varchar({ length: 255 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.commentId, t.userId] })]
);

// ============ FOLLOWERS ============
export const followers = createTable(
  "follower",
  (d) => ({
    followerId: d.varchar({ length: 255 }).notNull(),
    followingId: d.varchar({ length: 255 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [primaryKey({ columns: [t.followerId, t.followingId] })]
);

// ============ NOTIFICATIONS ============
export const notifications = createTable(
  "notification",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: d.varchar({ length: 255 }).notNull(),
    type: notificationTypeEnum().notNull(),
    title: d.varchar({ length: 255 }).notNull(),
    message: d.text(),
    relatedUserId: d.varchar({ length: 255 }),
    relatedPostId: d.integer(),
    relatedCommentId: d.integer(),
    isRead: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
  }),
  (t) => [
    index("notification_user_id_idx").on(t.userId),
    index("notification_is_read_idx").on(t.isRead),
  ]
);

// ============ REPORTS ============
export const reports = createTable("report", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  reporterId: d.varchar({ length: 255 }).notNull(),
  reportedUserId: d.varchar({ length: 255 }),
  reportedPostId: d.integer(),
  reportedCommentId: d.integer(),
  type: reportTypeEnum().notNull(),
  reason: d.text().notNull(),
  status: reportStatusEnum().default("pending").notNull(),
  reviewedBy: d.varchar({ length: 255 }),
  reviewedAt: d.timestamp({ withTimezone: true }),
  createdAt: d
    .timestamp({ withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

// ============ RELATIONS ============
export const usersRelations = relations(users, ({ many, one }) => ({
  posts: many(posts),
  comments: many(comments),
  postLikes: many(postLikes),
  postBookmarks: many(postBookmarks),
  commentLikes: many(commentLikes),
  socialLinks: many(userSocialLinks),
  emailPreferences: one(emailPreferences),
  followers: many(followers, { relationName: "follower" }),
  following: many(followers, { relationName: "following" }),
  notifications: many(notifications),
  postSeries: many(postSeries),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  category: one(categories, { fields: [posts.categoryId], references: [categories.id] }),
  series: one(postSeries, { fields: [posts.seriesId], references: [postSeries.id] }),
  tags: many(postTags),
  comments: many(comments),
  likes: many(postLikes),
  bookmarks: many(postBookmarks),
  views: many(postViews),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id] }),
  replies: many(comments),
  likes: many(commentLikes),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  posts: many(posts),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  posts: many(postTags),
}));

export const postTagsRelations = relations(postTags, ({ one }) => ({
  post: one(posts, { fields: [postTags.postId], references: [posts.id] }),
  tag: one(tags, { fields: [postTags.tagId], references: [tags.id] }),
}));

export const postSeriesRelations = relations(postSeries, ({ one, many }) => ({
  author: one(users, { fields: [postSeries.authorId], references: [users.id] }),
  posts: many(posts),
}));

export const followersRelations = relations(followers, ({ one }) => ({
  follower: one(users, { fields: [followers.followerId], references: [users.id], relationName: "follower" }),
  following: one(users, { fields: [followers.followingId], references: [users.id], relationName: "following" }),
}));

export const userSocialLinksRelations = relations(userSocialLinks, ({ one }) => ({
  user: one(users, { fields: [userSocialLinks.userId], references: [users.id] }),
}));

export const emailPreferencesRelations = relations(emailPreferences, ({ one }) => ({
  user: one(users, { fields: [emailPreferences.userId], references: [users.id] }),
}));

export const postLikesRelations = relations(postLikes, ({ one }) => ({
  post: one(posts, { fields: [postLikes.postId], references: [posts.id] }),
  user: one(users, { fields: [postLikes.userId], references: [users.id] }),
}));

export const postBookmarksRelations = relations(postBookmarks, ({ one }) => ({
  post: one(posts, { fields: [postBookmarks.postId], references: [posts.id] }),
  user: one(users, { fields: [postBookmarks.userId], references: [users.id] }),
}));

export const commentLikesRelations = relations(commentLikes, ({ one }) => ({
  comment: one(comments, { fields: [commentLikes.commentId], references: [comments.id] }),
  user: one(users, { fields: [commentLikes.userId], references: [users.id] }),
}));

export const postViewsRelations = relations(postViews, ({ one }) => ({
  post: one(posts, { fields: [postViews.postId], references: [posts.id] }),
  user: one(users, { fields: [postViews.userId], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  relatedUser: one(users, { fields: [notifications.relatedUserId], references: [users.id] }),
  relatedPost: one(posts, { fields: [notifications.relatedPostId], references: [posts.id] }),
  relatedComment: one(comments, { fields: [notifications.relatedCommentId], references: [comments.id] }),
}));

// ============ ZOD SCHEMAS ============
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export const insertPostSchema = createInsertSchema(posts);
export const selectPostSchema = createSelectSchema(posts);
export const insertCommentSchema = createInsertSchema(comments);
export const selectCommentSchema = createSelectSchema(comments);

// ============ TYPES ============
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;