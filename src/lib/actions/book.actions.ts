"use server";

import { CreateBook, TextSegment } from "@/types";
import { connectToDatabase } from "@/database/mongoose";
import { escapeRegex, generateSlug, serializeData } from "@/lib/utils";
import Book from "@/database/models/book.model";
import BookSegment from "@/database/models/book-segment.model";
import mongoose from "mongoose";
import { getUserPlan } from "@/lib/subscription.server";

/**
 * Retrieves all books from the database.
 * If a search term is provided, it performs a case-insensitive search
 * on both the book title and author fields using a regular expression.
 * Results are sorted by creation date in descending order.
 * Returns a serialized array of book objects on success, or an error on failure.
 */
// Get all books
export const getAllBooks = async (search?: string) => {
  try {
    await connectToDatabase();

    let query = {};

    if (search) {
      const escapedSearch = escapeRegex(search);
      const regex = new RegExp(escapedSearch, "i");
      query = {
        $or: [{ title: { $regex: regex } }, { author: { $regex: regex } }],
      };
    }

    const books = await Book.find(query).sort({ createdAt: -1 }).lean();

    return {
      success: true,
      data: serializeData(books),
    };
  } catch (e) {
    console.error("Error connecting to database", e);
    return {
      success: false,
      error: e,
    };
  }
};

/**
 * Checks if a book with the given title already exists in the database.
 * Generates a slug from the title and checks if it is unique.
 * Returns a serialized book object if found, or false on failure.
 */
// Check if book exists
export const checkBookExists = async (title: string) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        exists: true,
        book: serializeData(existingBook),
      };
    }

    return {
      exists: false,
    };
  } catch (e) {
    console.error("Error checking book exists", e);
    return {
      exists: false,
      error: e,
    };
  }
};

/**
 * Creates a new book in the database.
 * Generates a slug from the title and checks if it is unique.
 * Checks subscription limits before creating a book.
 * Returns a serialized book object on success, or an error on failure.
 */
// Create book
export const createBook = async (data: CreateBook) => {
  try {
    await connectToDatabase();

    const slug = generateSlug(data.title);

    const existingBook = await Book.findOne({ slug }).lean();

    if (existingBook) {
      return {
        success: true,
        data: serializeData(existingBook),
        alreadyExists: true,
      };
    }

    // Todo: Check subscription limits before creating a book
    const { getUserPlan } = await import("@/lib/subscription.server");
    const { PLAN_LIMITS } = await import("@/lib/subscription-constants");

    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();

    if (!userId || userId !== data.clerkId) {
      return { success: false, error: "Unauthorized" };
    }

    const plan = await getUserPlan();
    const limits = PLAN_LIMITS[plan];

    const bookCount = await Book.countDocuments({ clerkId: userId });

    if (bookCount >= limits.maxBooks) {
      const { revalidatePath } = await import("next/cache");
      revalidatePath("/");

      return {
        success: false,
        error: `You have reached the maximum number of books allowed for your ${plan} plan (${limits.maxBooks}). Please upgrade to add more books.`,
        isBillingError: true,
      };
    }

    const book = await Book.create({
      ...data,
      clerkId: userId,
      slug,
      totalSegments: 0,
    });

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (e) {
    console.error("Error creating book", e);
    return {
      success: false,
      error: e,
    };
  }
};

/**
 * Retrieves a book from the database by its slug.
 * Returns a serialized book object on success, or an error on failure.
 */
// Get book by slug
export const getBookBySlug = async (slug: string) => {
  try {
    await connectToDatabase();

    const book = await Book.findOne({ slug }).lean();

    if (!book) {
      return { success: false, error: "Book not found" };
    }

    return {
      success: true,
      data: serializeData(book),
    };
  } catch (e) {
    console.error("Error fetching book by slug", e);
    return {
      success: false,
      error: e,
    };
  }
};

/**
 * Saves book segments to the database.
 * Inserts the segments into the BookSegment collection.
 * Updates the totalSegments field in the Book collection.
 * Returns a success message and the number of segments created on success, or an error on failure.
 */
// Save book segments
export const saveBookSegments = async (
  bookId: string,
  clerkId: string,
  segments: TextSegment[],
) => {
  try {
    await connectToDatabase();

    console.log("Saving book segments", bookId, clerkId, segments);

    const segmentsToInsert = segments.map(
      ({ text, segmentIndex, pageNumber, wordCount }) => ({
        clerkId,
        bookId,
        content: text,
        segmentIndex,
        pageNumber,
        wordCount,
      }),
    );

    await BookSegment.insertMany(segmentsToInsert);

    await Book.findByIdAndUpdate(bookId, { totalSegments: segments.length });

    console.log("Book segments saved successfully");

    return {
      success: true,
      data: { segmentCreated: segments.length },
    };
  } catch (e) {
    console.error("Error saving book segments", e);
    return {
      success: false,
      error: e,
    };
  }
};

/**
 * Searches book segments using MongoDB text search with regex fallback.
 * Returns a serialized array of segments on success, or an error on failure.
 */
// Search book segments by query
export const searchBookSegments = async (
  bookId: string,
  query: string,
  limit: number = 5,
) => {
  try {
    await connectToDatabase();

    console.log(`Searching for: "${query}" in book ${bookId}`);

    const bookObjectId = new mongoose.Types.ObjectId(bookId);

    // Try MongoDB text search first (requires text index)
    let segments: Record<string, unknown>[] = [];

    try {
      segments = await BookSegment.find({
        bookId: bookObjectId,
        $text: { $search: query },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({ score: { $meta: "textScore" } })
        .limit(limit)
        .lean();
    } catch {
      // Text index may not exist — fall through to regex fallback
      segments = [];
    }

    // Fallback: regex search matching ANY keyword
    if (segments.length === 0) {
      const keywords = query.split(/\s+/).filter((k) => k.length > 2);
      const pattern = keywords.map(escapeRegex).join("|");

      segments = await BookSegment.find({
        bookId: bookObjectId,
        content: { $regex: pattern, $options: "i" },
      })
        .select("_id bookId content segmentIndex pageNumber wordCount")
        .sort({ segmentIndex: 1 })
        .limit(limit)
        .lean();
    }

    console.log(`Search complete. Found ${segments.length} results`);

    return {
      success: true,
      data: serializeData(segments),
    };
  } catch (error) {
    console.error("Error searching segments:", error);
    return {
      success: false,
      error: (error as Error).message,
      data: [],
    };
  }
};
