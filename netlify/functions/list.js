exports.handler = async (event) => {
  try {
    const params = new URLSearchParams(event.queryStringParameters || {});
    const path = params.get("path") || "";

    const apiURL = `https://api.github.com/repos/tejasnb2008/2-PUC-FINAL-EXAM-RESOURCES-/contents/${path}`;

    const res = await fetch(apiURL, {
      headers: { "User-Agent": "Netlify-Function" }
    });

    const data = await res.json();

    // Not a folder or nothing found
    if (!Array.isArray(data)) {
      return {
        statusCode: 200,
        body: JSON.stringify([])
      };
    }

    const items = data.map(it => ({
      name: it.name,
      type: it.type,          // "file" or "dir"
      download_url: it.download_url,
      path: it.path
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(items)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Server error",
        details: String(err)
      })
    };
  }
};
