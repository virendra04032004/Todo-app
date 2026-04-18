const API = "";
    let currentFilter = "all";

    // ── Toast ──────────────────────────────────────────────────
    function showToast(msg, ms = 2500) {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.style.display = "block";
      setTimeout(() => (t.style.display = "none"), ms);
    }

    function showError(msg) {
      const el = document.getElementById("form-error");
      el.textContent = msg;
      el.style.display = msg ? "block" : "none";
    }

    // ── API helpers ────────────────────────────────────────────
    async function apiFetch(url, opts = {}) {
      const res = await fetch(API + url, {
        headers: { "Content-Type": "application/json" },
        ...opts,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      return json;
    }

    // ── Render ─────────────────────────────────────────────────
    function priorityLabel(p) {
      return { high: "🔴 High", medium: "🟡 Medium", low: "🔵 Low" }[p] || p;
    }

    function renderList(todos) {
      const ul = document.getElementById("todo-list");
      ul.innerHTML = "";

      if (!todos.length) {
        ul.innerHTML = '<li class="empty-state">No todos here — add one above! 🎉</li>';
        return;
      }

      todos.forEach((todo) => {
        const li = document.createElement("li");
        li.id = `todo-${todo._id}`;
        if (todo.completed) li.classList.add("completed-item");
        li.innerHTML = `
          <input type="checkbox" class="todo-check" ${todo.completed ? "checked" : ""}
            onchange="handleToggle('${todo._id}', this.checked)" />
          <span class="todo-text ${todo.completed ? "done" : ""}" id="text-${todo._id}">${escHtml(todo.text)}</span>
          <span class="priority-badge priority-${todo.priority}">${priorityLabel(todo.priority)}</span>
          <button class="btn-edit" onclick="startEdit('${todo._id}')">✏️ Edit</button>
          <button class="btn-delete" onclick="handleDelete('${todo._id}')">Delete</button>
        `;
        ul.appendChild(li);
      });
    }

    function renderStats(stats) {
      document.getElementById("stat-total").textContent  = stats.total;
      document.getElementById("stat-active").textContent = stats.active;
      document.getElementById("stat-done").textContent   = stats.completed;

      const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
      document.getElementById("progress-bar").style.width = pct + "%";
      document.getElementById("progress-label").textContent = pct + "% complete";
    }

    function escHtml(str) {
      return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }

    // ── Refresh ────────────────────────────────────────────────
    async function refresh() {
      try {
        const [todos, stats] = await Promise.all([
          apiFetch(`/api/todos?filter=${currentFilter}`),
          apiFetch("/api/todos/stats"),
        ]);
        renderList(todos);
        renderStats(stats);
      } catch (err) {
        showToast("⚠️ " + err.message);
      }
    }

    // ── Add ────────────────────────────────────────────────────
    async function handleAdd(e) {
      e.preventDefault();
      showError("");
      const text     = document.getElementById("inp-text").value.trim();
      const priority = document.getElementById("inp-priority").value;
      if (!text) return showError("Please enter some text.");

      try {
        await apiFetch("/api/todos", {
          method: "POST",
          body: JSON.stringify({ text, priority }),
        });
        e.target.reset();
        showToast("✅ Todo added!");
        refresh();
      } catch (err) {
        showError(err.message);
      }
    }

    // ── Toggle complete ────────────────────────────────────────
    async function handleToggle(id, completed) {
      try {
        await apiFetch(`/api/todos/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        });
        refresh();
      } catch (err) {
        showToast("⚠️ " + err.message);
        refresh(); // revert checkbox visually
      }
    }

    // ── Inline Edit ────────────────────────────────────────────
    function startEdit(id) {
      const li       = document.getElementById(`todo-${id}`);
      const textSpan = document.getElementById(`text-${id}`);
      const current  = textSpan.textContent;

      // Replace text span with input + save/cancel buttons
      textSpan.outerHTML = `<input class="edit-input" id="edit-${id}" value="${escHtml(current)}" />`;
      const editBtn   = li.querySelector(".btn-edit");
      const deleteBtn = li.querySelector(".btn-delete");

      editBtn.textContent   = "💾 Save";
      editBtn.className     = "btn-save";
      editBtn.setAttribute("onclick", `commitEdit('${id}')`);

      // Insert cancel button before delete
      const cancelBtn = document.createElement("button");
      cancelBtn.className = "btn-cancel";
      cancelBtn.textContent = "✖ Cancel";
      cancelBtn.setAttribute("onclick", `cancelEdit('${id}', \`${escHtml(current)}\`)`);
      li.insertBefore(cancelBtn, deleteBtn);

      document.getElementById(`edit-${id}`).focus();
    }

    async function commitEdit(id) {
      const input = document.getElementById(`edit-${id}`);
      const newText = input.value.trim();
      if (!newText) return showToast("⚠️ Text cannot be empty.");

      try {
        await apiFetch(`/api/todos/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ text: newText }),
        });
        showToast("✏️ Todo updated!");
        refresh();
      } catch (err) {
        showToast("⚠️ " + err.message);
      }
    }

    function cancelEdit(id, original) {
      refresh(); // easiest way to revert UI
    }

    // ── Delete ─────────────────────────────────────────────────
    async function handleDelete(id) {
      if (!confirm("Delete this todo?")) return;
      try {
        await apiFetch(`/api/todos/${id}`, { method: "DELETE" });
        showToast("🗑️ Todo deleted.");
        refresh();
      } catch (err) {
        showToast("⚠️ " + err.message);
      }
    }

    // ── Clear completed ────────────────────────────────────────
    async function clearCompleted() {
      const count = parseInt(document.getElementById("stat-done").textContent);
      if (count === 0) return showToast("No completed todos to clear.");
      if (!confirm(`Delete all ${count} completed todos?`)) return;
      try {
        await apiFetch("/api/todos/completed/all", { method: "DELETE" });
        showToast("🧹 Cleared completed todos!");
        refresh();
      } catch (err) {
        showToast("⚠️ " + err.message);
      }
    }

    // ── Filter ─────────────────────────────────────────────────
    function setFilter(filter, btn) {
      currentFilter = filter;
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      refresh();
    }

    // ── Init ───────────────────────────────────────────────────
    refresh();