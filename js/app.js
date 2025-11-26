async function api(path) {
  const res = await fetch('/.netlify/functions/list?path=' + encodeURIComponent(path || ''));
  return res.json();
}

const EXCLUDED = ["index.html", "styles.css", "js", "netlify"];

function render(path, items) {
  const list = document.getElementById('folder-list');
  const crumbs = document.getElementById('breadcrumbs');

  crumbs.innerHTML = `Path: /${path || ''}`;

  list.innerHTML = "";

  items
    .filter(it => !EXCLUDED.includes(it.name)) // remove website files
    .forEach(it => {
      const div = document.createElement("div");
      div.className = "item";

      const name = document.createElement("span");
      name.textContent = it.name;

      const action = document.createElement("a");

      if (it.type === "dir") {
        action.textContent = "Open";
        action.href = "?path=" + encodeURIComponent(path ? `${path}/${it.name}` : it.name);
      } else {
        // file link (GitHub raw URL)
        action.textContent = "Download";
        action.href = it.download_url;
        action.target = "_blank";
      }

      div.appendChild(name);
      div.appendChild(action);

      list.appendChild(div);
    });

  if (list.innerHTML.trim() === "") {
    list.innerHTML = "<p>No files found in this folder.</p>";
  }
}

async function init() {
  const params = new URLSearchParams(window.location.search);
  const path = params.get("path") || "";
  const data = await api(path);
  render(path, data);
}

document.addEventListener("DOMContentLoaded", init);
