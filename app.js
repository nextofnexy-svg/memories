```javascript
;(() => {
  const $ = id => document.getElementById(id);
  const bucket = "riaa";
  const loginEmail = "kashmfnga@gmail.com";
  const allowedUsername = "memories";

  const url = window.SUPABASE_URL;
  const key = window.SUPABASE_PUBLISHABLE_KEY;

  const setMsg = (id, message) => {
    const element = $(id);
    if (element) element.textContent = message;
  };

  const show = loggedIn => {
    $("login").classList.toggle("hidden", loggedIn);
    $("galleryPage").classList.toggle("hidden", !loggedIn);
  };

  if (!url || !key || !window.supabase) {
    setMsg("loginMsg", "Setup error: check config.js and reload.");
    return;
  }

  const db = window.supabase.createClient(url, key);

  async function refresh() {
    setMsg("galleryMsg", "Loading memories…");

    const { data, error } = await db.storage
      .from(bucket)
      .list("", {
        limit: 100,
        sortBy: { column: "created_at", order: "desc" }
      });

    if (error) {
      setMsg("galleryMsg", "Could not load gallery: " + error.message);
      return;
    }

    const gallery = $("gallery");
    gallery.replaceChildren();

    const items = (data || []).filter(
      file => file.name && !file.name.startsWith(".")
    );

    $("count").textContent = items.length + " memories";

    for (const file of items) {
      const { data: signed, error: signedError } = await db.storage
        .from(bucket)
        .createSignedUrl(file.name, 300);

      if (signedError) continue;

      const card = document.createElement("article");
      card.className = "memory";

      const img = document.createElement("img");
      img.src = signed.signedUrl;
      img.alt = "A memory";
      img.loading = "lazy";

      const caption = document.createElement("div");
      caption.className = "caption";
      caption.textContent = file.name
        .replace(/^\d+-/, "")
        .replace(/\.[^.]+$/, "")
        .replace(/[-_]/g, " ") || "A memory";

      const del = document.createElement("button");
      del.className = "delete";
      del.textContent = "Remove photo";

      del.onclick = async () => {
        if (!confirm("Remove this photo?")) return;

        const { error: deleteError } = await db.storage
          .from(bucket)
          .remove([file.name]);

        setMsg(
          "galleryMsg",
          deleteError ? deleteError.message : "Photo removed."
        );

        if (!deleteError) await refresh();
      };

      card.append(img, caption, del);
      gallery.append(card);
    }

    setMsg(
      "galleryMsg",
      items.length ? "" : "No memories yet. Add your first photo above."
    );
  }

  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const username = $("email").value.trim().toLowerCase();
    const password = $("password").value;

    if (username !== allowedUsername) {
      setMsg("loginMsg", "Incorrect username or password.");
      return;
    }

    setMsg("loginMsg", "Signing in…");

    const { error } = await db.auth.signInWithPassword({
      email: loginEmail,
      password
    });

    if (error) {
      console.error("Supabase sign-in error:", error.message);
      setMsg("loginMsg", "Login failed. Check your password and try again.");
      return;
    }

    $("loginForm").reset();
    show(true);
    await refresh();
  });

  $("uploadForm").addEventListener("submit", async event => {
    event.preventDefault();

    const file = $("photo").files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMsg("uploadMsg", "Please choose a photo under 5 MB.");
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp", "image/gif"]
      .includes(file.type)) {
      setMsg("uploadMsg", "Choose a JPG, PNG, WEBP, or GIF.");
      return;
    }

    $("uploadBtn").disabled = true;
    setMsg("uploadMsg", "Uploading…");

    const label = $("caption").value.trim()
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .slice(0, 50);

    const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = Date.now() + "-" + (label || filename);

    const { error } = await db.storage.from(bucket).upload(path, file, {
      contentType: file.type
    });

    $("uploadBtn").disabled = false;

    if (error) {
      setMsg("uploadMsg", "Upload failed: " + error.message);
      return;
    }

    $("uploadForm").reset();
    setMsg("uploadMsg", "Memory added.");
    await refresh();
  });

  $("logout").addEventListener("click", async () => {
    await db.auth.signOut();
    show(false);
  });

  db.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error("Session check failed:", error.message);
      show(false);
      return;
    }

    show(Boolean(data.session));
    if (data.session) refresh();
  });
})();
```
