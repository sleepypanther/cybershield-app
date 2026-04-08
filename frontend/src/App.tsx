import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gift,
  Heart,
  Mail,
  MoonStar,
  Sparkles,
} from "lucide-react";

const HER_NAME = "Phutku";

const typingLines = [
  "Aditi, today is all about your smile, your softness, and your beautiful heart.",
  "You make ordinary moments feel warm, graceful, and full of light.",
  "Your presence has a calm magic that makes everything around you feel more special.",
  "I want to grow old with you.",
];

const photoSlides = [
  {
    title: "21 December 2024",
    caption: "A day remembered because it marked the beginning of someone truly unforgettable.",
  },
  {
    title: "29 March",
    caption: "A beautiful date that now carries warmth, closeness, and one deeply special memory.",
  },
  {
    title: "Her Glow",
    caption: "A soft memory that feels gentle, dreamy, and full of the same sweetness that makes her special.",
  },
];

const loveLetterLines = [
  "Dear Aditi,",
  "Today is a celebration of your kindness, your smile, your warmth, and the beautiful light you carry so naturally.",
  "You have a softness that comforts, a presence that shines, and a way of making moments feel more meaningful just by being there.",
  "Some dates become special because they are connected to someone unforgettable, and every beautiful memory here carries the same gentleness that lives in you.",
  "And somewhere inside all these soft little words is one truth that stays forever: I want to grow old with you.",
  "Happy Birthday, Phutku. May your life always be filled with love, peace, glowing happiness, and everything as lovely as your heart.",
];

const surpriseMessages = [
  "Aditi, your smile deserves a sky full of soft lights and endless happiness.",
  "Phutku, you are pure sweetness, calm energy, and the kind of person who makes life feel beautiful.",
  "You deserve love, peace, joy, and birthdays that feel as special as you are.",
];

const heartParticles = [
  { left: "6%", size: 18, delay: 0, duration: 14 },
  { left: "14%", size: 26, delay: 1, duration: 16 },
  { left: "21%", size: 14, delay: 4, duration: 13 },
  { left: "29%", size: 22, delay: 2, duration: 17 },
  { left: "36%", size: 16, delay: 7, duration: 12 },
  { left: "45%", size: 24, delay: 3, duration: 15 },
  { left: "52%", size: 18, delay: 5, duration: 14 },
  { left: "61%", size: 30, delay: 1, duration: 19 },
  { left: "69%", size: 16, delay: 8, duration: 13 },
  { left: "76%", size: 20, delay: 2, duration: 16 },
  { left: "84%", size: 14, delay: 6, duration: 12 },
  { left: "92%", size: 24, delay: 4, duration: 18 },
];

const fireworkBursts = [
  { left: "12%", top: "18%", color: "#f9a8d4", delay: 0.15 },
  { left: "28%", top: "12%", color: "#c084fc", delay: 0.45 },
  { left: "48%", top: "10%", color: "#fde68a", delay: 0.75 },
  { left: "68%", top: "16%", color: "#7dd3fc", delay: 1.05 },
  { left: "84%", top: "20%", color: "#fda4af", delay: 1.35 },
];

function TypingMessage({ lines }: { lines: string[] }) {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Alternate between typing and deleting to keep the message feeling alive.
    const current = lines[lineIndex];
    const finishedTyping = !isDeleting && charIndex === current.length;
    const finishedDeleting = isDeleting && charIndex === 0;

    const timeout = window.setTimeout(
      () => {
        if (finishedTyping) {
          setIsDeleting(true);
          return;
        }

        if (finishedDeleting) {
          setIsDeleting(false);
          setLineIndex((prev) => (prev + 1) % lines.length);
          return;
        }

        setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
      },
      finishedTyping ? 1500 : isDeleting ? 30 : 70
    );

    return () => window.clearTimeout(timeout);
  }, [charIndex, isDeleting, lineIndex, lines]);

  return (
    <div className="min-h-[4.5rem] text-base leading-8 text-white/85 md:text-xl">
      <span>{lines[lineIndex].slice(0, charIndex)}</span>
      <motion.span
        aria-hidden="true"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Number.POSITIVE_INFINITY }}
        className="ml-1 inline-block h-6 w-[2px] rounded-full bg-white/90 align-middle"
      />
    </div>
  );
}

function FloatingHearts() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {heartParticles.map((heart, index) => (
        <motion.div
          key={index}
          className="absolute bottom-[-10%] text-pink-200/70"
          style={{ left: heart.left }}
          animate={{
            y: ["0%", "-120vh"],
            x: [0, index % 2 === 0 ? 28 : -28, 0],
            opacity: [0, 0.9, 0],
            scale: [0.8, 1.15, 1],
          }}
          transition={{
            duration: heart.duration,
            delay: heart.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        >
          <Heart
            fill="currentColor"
            size={heart.size}
            className="drop-shadow-[0_0_22px_rgba(255,182,193,0.6)]"
          />
        </motion.div>
      ))}
    </div>
  );
}

function FireworksOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {fireworkBursts.map((burst, burstIndex) => (
        <div
          key={burstIndex}
          className="absolute"
          style={{ left: burst.left, top: burst.top }}
        >
          {Array.from({ length: 12 }).map((_, dotIndex) => {
            const angle = (Math.PI * 2 * dotIndex) / 12;
            const x = Math.cos(angle) * 86;
            const y = Math.sin(angle) * 86;

            return (
              <motion.span
                key={dotIndex}
                className="absolute left-0 top-0 h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: burst.color,
                  boxShadow: `0 0 26px ${burst.color}`,
                }}
                initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                animate={{
                  x: [0, x],
                  y: [0, y],
                  scale: [0, 1.15, 0.2],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 1.45,
                  delay: burst.delay,
                  ease: "easeOut",
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function GiftModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const surprise = useMemo(
    () => surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)],
    [open]
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#12071f]/45 px-4 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass-panel relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-white/20 px-6 py-8 text-white shadow-[0_24px_80px_rgba(43,11,71,0.35)]"
            initial={{ opacity: 0, scale: 0.82, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 18 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            onClick={(event) => event.stopPropagation()}
          >
            <motion.div
              className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-pink-400/30 blur-3xl"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-sky-300/20 blur-3xl"
              animate={{ scale: [1.05, 0.95, 1.05] }}
              transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
            />

            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/14"
              animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
              transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY }}
            >
              <Gift className="h-8 w-8 text-yellow-200" />
            </motion.div>

            <h3 className="font-serif text-3xl text-white md:text-4xl">
              A Little Surprise
            </h3>
            <p className="mt-4 text-lg leading-8 text-white/82">{surprise}</p>
            <p className="mt-3 text-sm leading-7 text-white/62">
              May your life always stay full of glow, gentle moments, and the
              kind of happiness that looks beautiful on you.
            </p>

            <button
              onClick={onClose}
              className="mt-8 inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white transition duration-300 hover:bg-white/18"
            >
              Keep This Close
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function LoveStorySection() {
  return (
    <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/18 p-6 md:p-8"
      >
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.12),transparent_28%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.42em] text-white/60">
            Our Love Story
          </p>
          <h3 className="mt-3 font-serif text-4xl text-white md:text-5xl">
            A soft little story about her
          </h3>
          <p className="mt-4 max-w-lg text-sm leading-8 text-white/74 md:text-base">
            Some people feel special in loud ways. Aditi feels special in the
            gentlest ones: in her smile, in her warmth, and in the way her
            presence stays with you long after a moment passes.
          </p>

          <div className="relative mt-10 pl-8">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-gradient-to-b from-rose-200/80 via-violet-200/70 to-sky-200/60" />
            {photoSlides.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -18 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.65, delay: index * 0.15 }}
                className="relative pb-10 last:pb-0"
              >
                <motion.div
                  className="absolute left-[-2.15rem] top-1 h-5 w-5 rounded-full border border-white/50 bg-gradient-to-br from-rose-200 via-pink-200 to-sky-200 shadow-[0_0_25px_rgba(255,255,255,0.25)]"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2.6, delay: index * 0.4, repeat: Number.POSITIVE_INFINITY }}
                />
                <p className="text-xs uppercase tracking-[0.35em] text-white/48">
                  Chapter 0{index + 1}
                </p>
                <h4 className="mt-2 font-serif text-3xl text-white">
                  {item.title}
                </h4>
                <p className="mt-3 max-w-md text-sm leading-8 text-white/72 md:text-base">
                  {item.caption}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 36 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
        className="glass-panel relative overflow-hidden rounded-[2rem] border border-white/18 p-6 md:p-8"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(125,211,252,0.12),transparent_24%)]" />
        <div className="relative flex h-full min-h-[420px] flex-col justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-white/55">
              Animated Promise
            </p>
            <h3 className="mt-3 font-serif text-4xl text-white md:text-5xl">
              Grace, warmth, and quiet magic
            </h3>
            <p className="mt-4 max-w-lg text-sm leading-8 text-white/72 md:text-base">
              Aditi has the kind of beauty that is not only seen, but felt. The
              kind that lives in softness, kindness, and the calm glow she brings
              into every memory connected to her.
            </p>
          </div>

          <div className="relative mt-10 flex items-center justify-center py-6">
            <motion.div
              className="absolute h-72 w-72 rounded-full border border-white/12 bg-white/6 blur-2xl"
              animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.55, 0.9, 0.55] }}
              transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute h-56 w-56 rounded-full border border-pink-200/25"
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              className="absolute h-40 w-40 rounded-full border border-sky-200/25"
              animate={{ rotate: -360 }}
              transition={{ duration: 14, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            />
            <motion.div
              animate={{ y: [0, -12, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-rose-200 via-pink-300 to-violet-300 shadow-[0_0_40px_rgba(255,192,203,0.45)]"
            >
              <Heart
                className="h-12 w-12 text-white drop-shadow-[0_4px_16px_rgba(99,0,46,0.35)]"
                fill="currentColor"
              />
            </motion.div>
            {[
              "You",
              "Me",
              "Us",
              "Forever",
            ].map((label, index) => {
              const positions = [
                "left-[14%] top-[18%]",
                "right-[12%] top-[22%]",
                "left-[18%] bottom-[18%]",
                "right-[15%] bottom-[16%]",
              ];

              return (
                <motion.div
                  key={label}
                  className={`absolute ${positions[index]} rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/74 backdrop-blur-xl`}
                  animate={{ y: [0, index % 2 === 0 ? -10 : 10, 0] }}
                  transition={{ duration: 3.5 + index * 0.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                >
                  {label}
                </motion.div>
              );
            })}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Her smile has the kind of light that makes everything feel softer.",
              "Her presence turns ordinary days into beautiful memories.",
              "Everything around her feels softer, calmer, and more beautiful.",
              "Some people are special. She feels unforgettable.",
            ].map((line, index) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 * index }}
                className="rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-7 text-white/72"
              >
                {line}
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

function CakeCuttingScene() {
  const [isCut, setIsCut] = useState(false);

  return (
    <motion.section
      initial={{ opacity: 0, y: 36 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="glass-panel relative overflow-hidden rounded-[2.2rem] border border-white/18 px-6 py-8 md:px-10 md:py-10"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(250,204,21,0.14),transparent_26%)]" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="text-xs uppercase tracking-[0.38em] text-white/58">
            Birthday Moment
          </p>
          <h3 className="mt-3 font-serif text-4xl text-white md:text-5xl">
            Tap the cake and cut it
          </h3>
          <p className="mt-4 max-w-lg text-sm leading-8 text-white/74 md:text-base">
            I removed the girl animation and turned this into a cake-only moment.
            The cake is styled closer to your reference: a white square base,
            blue hanging topper details, and soft yellow decorations on top.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {[
              "The cake itself is the button now, so the user taps the cake to cut it.",
              "White square cake base inspired by your screenshot.",
              "Blue-yellow topper details give it that handmade themed look.",
              "When cut, the top splits and soft confetti appears.",
            ].map((line, index) => (
              <motion.div
                key={line}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.12 }}
                className="rounded-[1.35rem] border border-white/12 bg-white/8 px-4 py-4 text-sm leading-7 text-white/72"
              >
                {line}
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-sm font-medium text-white/78">
            {isCut ? "Tap again to reset the cake." : "Tap the cake to cut it."}
          </p>
        </div>

        <div className="relative flex min-h-[460px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/12 bg-[linear-gradient(135deg,rgba(255,183,197,0.12),rgba(196,181,253,0.08),rgba(125,211,252,0.1),rgba(253,224,71,0.08),rgba(74,222,128,0.08))]">
          <motion.div
            className="absolute h-80 w-80 rounded-full bg-pink-300/18 blur-3xl"
            animate={{ scale: [0.95, 1.08, 0.95], opacity: [0.45, 0.75, 0.45] }}
            transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute left-[15%] top-[20%] h-36 w-36 rounded-full bg-violet-300/14 blur-3xl"
            animate={{ x: [0, 18, 0], y: [0, -12, 0] }}
            transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute right-[15%] bottom-[18%] h-32 w-32 rounded-full bg-emerald-300/12 blur-3xl"
            animate={{ x: [0, -16, 0], y: [0, 10, 0] }}
            transition={{ duration: 6.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-8 h-24 w-72 rounded-[50%] bg-white/10 blur-2xl"
            animate={{ scaleX: [1, 1.06, 1] }}
            transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
          />

          {Array.from({ length: 8 }).map((_, index) => {
            const positions = [
              "left-[12%] top-[16%]",
              "left-[24%] top-[10%]",
              "right-[18%] top-[14%]",
              "right-[10%] top-[24%]",
              "left-[18%] bottom-[24%]",
              "right-[24%] bottom-[20%]",
              "left-[10%] bottom-[36%]",
              "right-[12%] bottom-[34%]",
            ];

            return (
              <motion.div
                key={index}
                className={`absolute ${positions[index]} text-white/80`}
                animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4], scale: [0.9, 1.08, 0.9] }}
                transition={{ duration: 2.4 + index * 0.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Sparkles className="h-4 w-4 text-yellow-200/90" />
              </motion.div>
            );
          })}

          {[
            { left: "15%", delay: 0.2 },
            { left: "25%", delay: 0.8 },
            { left: "74%", delay: 0.4 },
            { left: "83%", delay: 1.1 },
          ].map((item, index) => (
            <motion.div
              key={index}
              className="absolute top-[22%] text-pink-200/70"
              style={{ left: item.left }}
              animate={{ y: [0, -28, -48], opacity: [0, 0.8, 0], scale: [0.7, 1, 0.9] }}
              transition={{ duration: 4, delay: item.delay, repeat: Number.POSITIVE_INFINITY, ease: "easeOut" }}
            >
              <Heart fill="currentColor" className="h-4 w-4" />
            </motion.div>
          ))}

          {isCut
            ? Array.from({ length: 18 }).map((_, index) => {
                const left = 15 + (index % 6) * 12;
                const colors = [
                  "#fda4af",
                  "#c4b5fd",
                  "#7dd3fc",
                  "#fde68a",
                  "#86efac",
                  "#f9a8d4",
                ];

                return (
                  <motion.span
                    key={index}
                    className="absolute top-[24%] h-3 w-2 rounded-full"
                    style={{ left: `${left}%`, backgroundColor: colors[index % colors.length] }}
                    initial={{ y: -10, opacity: 0, rotate: 0 }}
                    animate={{
                      y: [0, 120 + (index % 4) * 12],
                      x: [0, (index % 2 === 0 ? -1 : 1) * (18 + index * 1.5)],
                      opacity: [1, 1, 0],
                      rotate: [0, 140 + index * 8],
                    }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                  />
                );
              })
            : null}

          <button
            type="button"
            onClick={() => setIsCut((prev) => !prev)}
            className="relative h-[390px] w-[320px] cursor-pointer rounded-[2rem] outline-none transition hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label={isCut ? "Reset cake" : "Cut the cake"}
          >
            <motion.div
              className="absolute left-[1.1rem] top-[2.3rem] h-[15.2rem] w-[0.22rem] rounded-full bg-[#c9b784]"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3.6, repeat: Number.POSITIVE_INFINITY }}
            />
            <motion.div
              className="absolute right-[1.1rem] top-[2.3rem] h-[15.2rem] w-[0.22rem] rounded-full bg-[#c9b784]"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 3.8, repeat: Number.POSITIVE_INFINITY }}
            />
            <div className="absolute left-[0.8rem] top-[1.6rem] h-4 w-4 rounded-full bg-gradient-to-b from-yellow-200 to-yellow-400" />
            <div className="absolute left-[0.75rem] top-[2.45rem] h-3 w-3 rounded-full bg-blue-600" />
            <div className="absolute right-[0.8rem] top-[1.6rem] h-4 w-4 rounded-full bg-gradient-to-b from-yellow-200 to-yellow-400" />
            <div className="absolute right-[0.75rem] top-[2.45rem] h-3 w-3 rounded-full bg-blue-600" />

            <svg
              viewBox="0 0 320 390"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              <path
                d="M30 74 C95 90, 225 90, 290 74"
                fill="none"
                stroke="rgba(30,41,59,0.45)"
                strokeWidth="2"
              />
            </svg>

            {[
              { left: "4.3rem", top: "4.9rem", rotate: -6 },
              { left: "9.8rem", top: "5.6rem", rotate: 0 },
              { left: "15.9rem", top: "4.7rem", rotate: 14 },
            ].map((item, index) => (
              <motion.div
                key={index}
                className="absolute h-[3.6rem] w-[2.7rem] rounded-b-[0.9rem] rounded-t-[0.45rem] bg-blue-600 shadow-[0_6px_18px_rgba(37,99,235,0.28)]"
                style={{ left: item.left, top: item.top, rotate: `${item.rotate}deg` }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3 + index * 0.3, repeat: Number.POSITIVE_INFINITY }}
              >
                <div className="absolute left-1/2 top-0 h-[1.6rem] w-[0.42rem] -translate-x-[0.9rem] rounded-full bg-blue-600" />
                <div className="absolute left-1/2 top-0 h-[1.6rem] w-[0.42rem] translate-x-[0.48rem] rounded-full bg-blue-600" />
                <div className="absolute left-1/2 top-[0.95rem] h-[0.7rem] w-[1rem] -translate-x-1/2 rounded-[0.35rem] bg-blue-700" />
                <div className="absolute inset-x-[0.62rem] bottom-0 h-[0.9rem] bg-white/12" />
              </motion.div>
            ))}

            <div className="absolute bottom-[2.6rem] left-1/2 h-[12.4rem] w-[15.8rem] -translate-x-1/2 rounded-[1.1rem] bg-[linear-gradient(180deg,#f9fafb_0%,#f3f4f6_55%,#e5e7eb_100%)] shadow-[0_16px_40px_rgba(255,255,255,0.16)]" />
            <div className="absolute bottom-[13.2rem] left-1/2 h-[1rem] w-[14.3rem] -translate-x-1/2 rounded-full bg-white/90" />
            <div className="absolute bottom-[2.2rem] left-1/2 h-[2rem] w-[16.8rem] -translate-x-1/2 rounded-[1.2rem] bg-white/80 blur-[1px]" />

            {[
              { left: "4.1rem", size: "3rem", eye: "0.95rem" },
              { left: "8.3rem", size: "2.8rem", eye: "0.8rem" },
              { left: "12rem", size: "3.1rem", eye: "0.95rem" },
              { left: "16rem", size: "2.9rem", eye: "0.85rem" },
            ].map((topper, index) => (
              <motion.div
                key={index}
                className="absolute bottom-[8.1rem]"
                style={{ left: topper.left }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3 + index * 0.2, repeat: Number.POSITIVE_INFINITY }}
              >
                <div
                  className="relative rounded-full bg-[#f5ee63]"
                  style={{ width: topper.size, height: topper.size }}
                >
                  <div className="absolute left-[8%] right-[8%] top-[42%] h-[0.32rem] rounded-full bg-slate-900/75" />
                  <div
                    className="absolute left-1/2 top-[33%] -translate-x-1/2 rounded-full border-[3px] border-slate-400 bg-white"
                    style={{ width: topper.eye, height: topper.eye }}
                  >
                    <div className="absolute left-1/2 top-1/2 h-[0.34rem] w-[0.34rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#5c3b1f]" />
                  </div>
                  <div className="absolute left-1/2 top-[78%] h-[0.18rem] w-[0.75rem] -translate-x-1/2 rounded-full bg-slate-700/70" />
                </div>
              </motion.div>
            ))}

            <motion.div
              className="absolute bottom-[13.1rem] left-1/2 h-[8.6rem] w-[0.2rem] -translate-x-1/2 bg-slate-300/70"
              animate={isCut ? { opacity: [0, 1], scaleY: [0.1, 1] } : { opacity: 0, scaleY: 0.1 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />

            <motion.div
              className="absolute bottom-[3.7rem] left-[3.9rem] h-[9.8rem] w-[7rem] origin-bottom rounded-[0.95rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] shadow-[0_12px_28px_rgba(255,255,255,0.14)]"
              animate={
                isCut
                  ? { x: [-2, -10], rotate: [-1, -5], y: [0, 2] }
                  : { x: 0, rotate: 0, y: 0 }
              }
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
            <motion.div
              className="absolute bottom-[3.7rem] right-[3.9rem] h-[9.8rem] w-[7rem] origin-bottom rounded-[0.95rem] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] shadow-[0_12px_28px_rgba(255,255,255,0.14)]"
              animate={
                isCut
                  ? { x: [2, 10], rotate: [1, 5], y: [0, 2] }
                  : { x: 0, rotate: 0, y: 0 }
              }
              transition={{ duration: 0.55, ease: "easeOut" }}
            />

            <div className="absolute bottom-[12.1rem] left-[4.2rem] h-[1.05rem] w-[6.5rem] rounded-full bg-white/95" />
            <div className="absolute bottom-[12.1rem] right-[4.2rem] h-[1.05rem] w-[6.5rem] rounded-full bg-white/95" />

            <motion.div
              className="absolute bottom-[12.2rem] left-1/2 h-[0.16rem] w-[7.2rem] -translate-x-1/2 rounded-full bg-slate-300/85"
              animate={isCut ? { opacity: [0, 1], scaleX: [0, 1] } : { opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
            />
          </button>
        </div>
      </div>
    </motion.section>
  );
}

function LoveLetter() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.85, ease: "easeOut" }}
      className="glass-panel relative overflow-hidden rounded-[2.25rem] border border-white/18 px-6 py-8 md:px-10 md:py-10"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />
      <div className="flex items-center gap-3 text-white/70">
        <Mail className="h-5 w-5 text-rose-200" />
        <span className="text-xs uppercase tracking-[0.35em]">Love Letter</span>
      </div>

      <div className="mt-6 space-y-4">
        {loveLetterLines.map((line, index) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: index * 0.12 }}
            className={`${
              index === 0
                ? "font-serif text-3xl text-white"
                : "max-w-3xl text-base leading-8 text-white/82 md:text-lg"
            }`}
          >
            {line}
          </motion.p>
        ))}
      </div>
    </motion.section>
  );
}

export function App() {
  const [giftOpen, setGiftOpen] = useState(false);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#12071f] text-white">
      <div className="absolute inset-0 romantic-gradient" />
      <div className="absolute inset-0 aurora-overlay opacity-90" />
      <div className="absolute left-[-12%] top-[-8%] h-[28rem] w-[28rem] rounded-full bg-pink-400/30 blur-3xl" />
      <div className="absolute right-[-8%] top-[18%] h-[26rem] w-[26rem] rounded-full bg-sky-400/25 blur-3xl" />
      <div className="absolute bottom-[-14%] left-[22%] h-[24rem] w-[24rem] rounded-full bg-amber-300/20 blur-3xl" />

      <FloatingHearts />
      <FireworksOverlay />
      <GiftModal open={giftOpen} onClose={() => setGiftOpen(false)} />

      <main className="relative z-10">
        <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-5 pb-14 pt-24 sm:px-8 lg:px-10">
          <div className="grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.8 }}
                className="mb-5 inline-flex items-center gap-3 rounded-full border border-white/16 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.34em] text-white/70 backdrop-blur-xl"
              >
                <Heart fill="currentColor" className="h-3.5 w-3.5 text-rose-200" />
                Birthday Love Note
              </motion.div>

              <div className="max-w-3xl">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 14, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
                  className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/18 bg-white/10 shadow-[0_0_45px_rgba(255,255,255,0.12)]"
                >
                  <Sparkles className="h-7 w-7 text-yellow-200" />
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.95 }}
                  className="font-serif text-5xl leading-none text-white drop-shadow-[0_8px_30px_rgba(18,7,31,0.45)] sm:text-6xl md:text-7xl xl:text-[6.5rem]"
                >
                  Happy Birthday{" "}
                  <span className="bg-gradient-to-r from-rose-100 via-amber-100 to-sky-100 bg-clip-text text-transparent">
                    {HER_NAME}
                  </span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.9 }}
                  className="mt-5 text-lg text-white/85 md:text-2xl"
                >
                  Aditi, you are beautiful, rare, and deeply special ❤️
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.85 }}
                  className="mt-8 max-w-2xl rounded-[1.75rem] border border-white/16 bg-white/8 p-5 backdrop-blur-xl"
                >
                  <TypingMessage lines={typingLines} />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.85 }}
                  className="mt-8 flex flex-wrap gap-4"
                >
                  <motion.button
                    onClick={() => setGiftOpen(true)}
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 rounded-full border border-white/18 bg-white/14 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_50px_rgba(46,13,68,0.3)] backdrop-blur-xl transition"
                  >
                    <Gift className="h-4 w-4 text-amber-200" />
                    Open Your Gift
                  </motion.button>

                  <motion.a
                    href="#love-letter"
                    whileHover={{ scale: 1.04, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex items-center gap-3 rounded-full border border-white/14 bg-black/10 px-6 py-3.5 text-sm font-semibold text-white/86 backdrop-blur-xl transition"
                  >
                    <Mail className="h-4 w-4 text-rose-200" />
                    Read My Letter
                  </motion.a>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 32 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
              className="glass-panel relative overflow-hidden rounded-[2.2rem] border border-white/18 p-5 shadow-[0_24px_80px_rgba(32,10,48,0.32)]"
            >
              {/* This glass card acts as the emotional visual anchor beside the main birthday message. */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_40%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.14),transparent_30%)]" />
              <div className="relative rounded-[1.8rem] border border-white/12 bg-[#ffffff10] p-6 backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-white/55">
                      For You
                    </p>
                    <h2 className="mt-2 font-serif text-3xl text-white">
                      A Sky Full of Glow
                    </h2>
                  </div>
                  <motion.div
                    animate={{ rotate: [0, 12, -12, 0] }}
                    transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
                    className="rounded-full bg-white/12 p-3"
                  >
                    <MoonStar className="h-6 w-6 text-sky-100" />
                  </motion.div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2">
                  {[
                    {
                      title: "Her Smile",
                      text: "A smile so soft and beautiful that it deserves its own celebration.",
                    },
                    {
                      title: "Her Warmth",
                      text: "She carries a warmth that turns simple moments into beautiful memories.",
                    },
                    {
                      title: "Her Glow",
                      text: "Every gentle color and glowing detail here carries the same calm beauty she does.",
                    },
                    {
                      title: "Phutku",
                      text: "A sweet name for someone who deserves all the light, love, and happiness today.",
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 + index * 0.12, duration: 0.7 }}
                      whileHover={{ y: -6, scale: 1.02 }}
                      className="rounded-[1.4rem] border border-white/12 bg-white/9 p-4 backdrop-blur-lg"
                    >
                      <p className="text-sm uppercase tracking-[0.24em] text-white/48">
                        0{index + 1}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl text-white">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-7 text-white/72">
                        {item.text}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.95, duration: 0.75 }}
                  className="mt-6 rounded-[1.5rem] border border-white/12 bg-black/12 p-4"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/52">
                    Birthday Note
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h3 className="font-serif text-2xl text-white">
                        For Aditi
                      </h3>
                      <p className="mt-1 text-sm leading-7 text-white/70">
                        A page filled with soft lights, gentle motion, and loving details made just to celebrate her.
                      </p>
                    </div>
                    <div className="rounded-full border border-white/14 bg-white/10 px-4 py-2 text-sm font-medium text-white/88">
                      Only Her Vibe
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <LoveStorySection />
        </section>

        <section className="mx-auto w-full max-w-7xl px-5 py-2 sm:px-8 lg:px-10">
          <CakeCuttingScene />
        </section>

        <section
          id="love-letter"
          className="mx-auto w-full max-w-7xl px-5 py-10 pb-20 sm:px-8 lg:px-10"
        >
          <LoveLetter />
        </section>
      </main>
    </div>
  );
}
