import { db } from "~/server/db";
import { tags } from "~/server/db/schema";

const initialTags = [
    "Technology",
    "Programming",
    "Web Development",
    "Design",
    "Artificial Intelligence",
    "Machine Learning",
    "Data Science",
    "Career",
    "Productivity",
    "Health",
    "Fitness",
    "Lifestyle",
    "Travel",
    "Food",
    "Cooking",
    "Music",
    "Movies",
    "Gaming",
    "Books",
    "Writing",
    "Art",
    "Photography",
    "Science",
    "History",
    "Politics",
    "News",
    "Business",
    "Finance",
    "Education",
    "Sports",
    // Fanfiction specific
    "Fanfiction",
    "Alternate Universe",
    "Canon Divergence",
    "Shipping",
    "Hurt/Comfort",
    "Angst",
    "Fluff",
    "Slow Burn",
    "Enemies to Lovers",
    "One Shot",
    "Crossover",
    "Original Character",
];

function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-") // Replace spaces with -
        .replace(/[^\w\-]+/g, "") // Remove all non-word chars
        .replace(/\-\-+/g, "-"); // Replace multiple - with single -
}

async function seedTags() {
    console.log("Seeding tags...");

    const values = initialTags.map((name) => ({
        name,
        slug: slugify(name),
        description: `Posts about ${name}`,
    }));

    try {
        await db
            .insert(tags)
            .values(values)
            .onConflictDoNothing({ target: tags.name });

        console.log(`Successfully seeded ${values.length} tags.`);
    } catch (error) {
        console.error("Error seeding tags:", error);
        process.exit(1);
    }

    process.exit(0);
}

void seedTags();
