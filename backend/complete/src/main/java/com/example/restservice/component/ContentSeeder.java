package com.example.restservice.component;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteBatch;
import com.google.cloud.firestore.DocumentReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class ContentSeeder implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(ContentSeeder.class);
    private static final String COLLECTION_NAME = "content_bank";

    @Autowired(required = false)
    private Firestore firestore;

    @Value("${social.seeder.enabled:true}")
    private boolean seederEnabled;

    @Override
    public void run(String... args) throws Exception {
        if (!seederEnabled) {
            logger.info("Content seeder is disabled");
            return;
        }

        if (firestore == null) {
            logger.warn("Firestore not available - skipping content seeding");
            return;
        }

        try {
            QuerySnapshot snapshot = firestore.collection(COLLECTION_NAME).limit(1).get().get();

            if (snapshot.isEmpty()) {
                logger.info("Content bank is empty - seeding with evergreen baseball content...");
                seedContent();
            } else {
                logger.info("Content bank already populated - skipping seed");
            }
        } catch (Exception e) {
            logger.error("Error checking/seeding content bank: {}", e.getMessage(), e);
        }
    }

    private void seedContent() throws Exception {
        List<Map<String, Object>> contentList = getBaseballContent();

        WriteBatch batch = firestore.batch();

        for (Map<String, Object> content : contentList) {
            DocumentReference docRef = firestore.collection(COLLECTION_NAME).document();
            content.put("lastPosted", null);
            content.put("createdAt", new Date());
            batch.set(docRef, content);
        }

        batch.commit().get();
        logger.info("Successfully seeded {} content items to Firestore", contentList.size());
    }

    private List<Map<String, Object>> getBaseballContent() {
        List<Map<String, Object>> content = new ArrayList<>();

        content.add(createContent("DRILL",
            "Fielding Drill: The Wall Rebound. Find a brick wall. Stand 6 feet back. Throw a tennis ball and field it with 'soft hands'. Do 50 reps.",
            "#defense #baseball #homework",
            "Cinematic close up photo of a worn leather baseball glove resting on a wooden bench, golden hour lighting, high resolution",
            null));

        content.add(createContent("DRILL",
            "Batting Drill: The High Tee. Set tee at chest height. Focus on keeping hands above the ball to hit line drives. 'Chopping wood' builds bat speed.",
            "#hitting #baseball #battingcages",
            "A young athlete swinging a bat at a batting tee, dynamic action shot, sports photography, bright outdoor field",
            null));

        content.add(createContent("DRILL",
            "Pitching: The Towel Drill. Hold a hand towel instead of a ball. Go through motion. Snap towel at release point. Saves the arm, builds mechanics.",
            "#pitching #baseball #mechanics",
            "Close up of a baseball pitcher's hand gripping a ball, dramatic lighting, focus on finger placement, professional sports photo",
            null));

        content.add(createContent("DRILL",
            "The 5-10-5 Shuttle: 3 cones, 5 yards apart. Sprint 5 yards right, touch. Sprint 10 yards left, touch. Sprint 5 back to center. Baseball is explosive bursts!",
            "#speed #conditioning #baseball",
            "Three orange cones on a green grass field with morning dew, athletic training setup, crisp sports photography",
            null));

        content.add(createContent("MENTAL",
            "The .300 Rule: In baseball, if you fail 7 out of 10 times, you are a Hall of Famer. Don't let a strikeout ruin your day. Next pitch.",
            "#mindset #resilience #baseball",
            "A single baseball lying on home plate, dusty red clay, dramatic shadows, inspirational sports photography",
            null));

        content.add(createContent("MENTAL",
            "Control the Controllables: You can't control the umpire's call or the bad hop. You CAN control your effort and your attitude. Be a leader today.",
            "#leadership #sportsmanship #baseball",
            "A baseball dugout with equipment organized neatly, morning light streaming through, peaceful team sports atmosphere",
            null));

        content.add(createContent("TRIVIA",
            "Baseball Trivia: Bases in Little League are 60ft apart. In MLB, they are 90ft. That 30ft difference changes the speed of the game entirely!",
            "#trivia #baseball #learning",
            "Aerial view of a baseball diamond with white bases visible, geometric sports field photography, summer day",
            null));

        content.add(createContent("MISSION",
            "A glove costs $50. A bat costs $100. We provide the gear so kids can provide the hustle. Donate at kidsinmotionpa.org",
            "#nonprofit #kidsinmotion #donate",
            "A pile of colorful baseball bats and helmets stacked neatly against a chain link fence, bright sunny day",
            "https://firebasestorage.googleapis.com/v0/b/kids-in-motion-website-b1c09.appspot.com/o/images%2Fequipment-drive.jpg?alt=media"));

        content.add(createContent("MISSION",
            "Every kid deserves that feeling of their first hit. Help us keep clinics free for PA families. kidsinmotionpa.org",
            "#nonprofit #kidsinmotion #community",
            "A child's baseball glove next to a shiny new baseball, hopeful warm lighting, emotional sports photography",
            null));

        content.add(createContent("ENGAGEMENT",
            "Phillies Fans: Who is your favorite player of all time and why? Drop a comment! ⬇️⚾️",
            "#phillies #community #baseball",
            "Citizens Bank Park exterior at sunset, Philadelphia Phillies stadium, vibrant red colors, iconic sports venue",
            null));

        content.add(createContent("ENGAGEMENT",
            "The sun is out and the field is calling. ☀️ What position are you hoping to play this season? Let us know!",
            "#hype #weekend #baseball",
            "An empty baseball field on a sunny morning, fresh white lines, inviting green grass, optimistic sports photography",
            null));

        content.add(createContent("ENGAGEMENT",
            "Tag a coach who made a difference in your life. Let's show our volunteers some love today! ❤️⚾️",
            "#appreciation #volunteers #coaches",
            "A coach kneeling next to a young player giving instruction, warm mentorship moment, community sports photography",
            null));

        return content;
    }

    private Map<String, Object> createContent(String type, String body, String tags, String imagePrompt, String realImageUrl) {
        Map<String, Object> content = new HashMap<>();
        content.put("type", type);
        content.put("body", body);
        content.put("tags", tags);
        content.put("imagePrompt", imagePrompt);
        content.put("realImageUrl", realImageUrl);
        return content;
    }
}
