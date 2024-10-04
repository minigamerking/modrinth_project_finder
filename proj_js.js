document.addEventListener("DOMContentLoaded", function () {
    const toggleButtons = document.querySelectorAll(".toggle-btn");
    const dropdownBtn = document.getElementById("versionDropdownBtn");
    const dropdownContent = document.getElementById("versionDropdownContent");
    const versionButtons = document.querySelectorAll(".version-btn");

    // Handle button toggling
    toggleButtons.forEach(button => {
        button.addEventListener("click", function () {
            const isSelected = this.getAttribute("data-selected") === "true";
            this.setAttribute("data-selected", !isSelected);
            this.classList.toggle("active");
        });
    });

    // Show/hide the dropdown menu when clicked
    dropdownBtn.addEventListener("click", function () {
        dropdownContent.classList.toggle("show");
    });

    // Handle version button toggling
    versionButtons.forEach(button => {
        button.addEventListener("click", function () {
            this.classList.toggle("active");
        });
    });
});

// Add an event listener for the GET request
document.getElementById("getRequestBtn").addEventListener("click", function () {
    const selectedProjectTypes = Array.from(document.querySelectorAll("#projectTypes .toggle-btn.active")).map(btn => btn.id.replace("Check", ""));
    const selectedModLoaders = Array.from(document.querySelectorAll("#modLoaders .toggle-btn.active")).map(btn => btn.id.replace("Check", ""));
    const selectedEnvironments = Array.from(document.querySelectorAll("#environments .toggle-btn.active")).map(btn => btn.id.replace("Check", ""));
    const selectedMinecraftVersions = Array.from(document.querySelectorAll(".version-btn.active")).map(btn => btn.getAttribute("data-version"));

    console.log("Selected Project Types:", selectedProjectTypes);
    console.log("Selected Mod Loaders:", selectedModLoaders);
    console.log("Selected Environments:", selectedEnvironments);
    console.log("Selected Minecraft Versions:", selectedMinecraftVersions);

    fetchModData(selectedProjectTypes, selectedModLoaders, selectedEnvironments, selectedMinecraftVersions);
});

async function fetchModData(selectedProjectTypes, selectedModLoaders, selectedEnvironments, selectedMinecraftVersions) {
    const url = "https://api.modrinth.com/v2/projects_random?count=1&reason='just making a random mod picker, sorry if this is increasing expenses'"; // Example URL
    const maxAttempts = 100;

    for (let attempts = 0; attempts < maxAttempts; attempts++) {
        try {
            const response = await fetch(url);
            if (response.status === 400) {
                console.log("Error 400: Bad Request. Stopping search.");
                await delay(5000);
            }

            if (!response.ok) {
                throw new Error("Network response was not ok");
            }

            const data = await response.json();
            const finished = updateModPage(data[0], selectedProjectTypes, selectedModLoaders, selectedEnvironments, selectedMinecraftVersions);

            if (finished === "completed") {
                break;
            }

        } catch (error) {
            console.error("Error in GET request:", error);
        }
        await delay(500);
    }
}

function updateModPage(modData, selectedProjectTypes, selectedModLoaders, selectedEnvironments, selectedMinecraftVersions) {
    const modLoaders = modData.loaders;
    const projectType = modData.project_type;
    const clientSide = modData.client_side;
    const serverSide = modData.server_side;
    const modVersions = modData.game_versions;

    if (selectedProjectTypes.includes("resourcepack")) {
        console.log("Resource Pack")
    } else if (selectedModLoaders.length > 0 && !selectedModLoaders.some(loader => modLoaders.includes(loader)) ) {
        return false;
    }

    if (selectedProjectTypes.length > 0 && !selectedProjectTypes.includes(projectType)) {
        return false;
    }

    if (selectedEnvironments.length > 0) {
        const clientSelected = selectedEnvironments.includes("client");
        const serverSelected = selectedEnvironments.includes("server");

        if (clientSelected !== serverSelected) {  // If only one is selected
            if (clientSelected && !(clientSide === "required" && serverSide !== "required")) {
                console.log("Mod does not match client-side requirement. Skipping.");
                return "";  // Try again with the next mod
            }
            if (serverSelected && !(serverSide === "required" && clientSide !== "required")) {
                console.log("Mod does not match server-side requirement. Skipping.");
                return "";  // Try again with the next mod
            }
        }
    }

    if (selectedMinecraftVersions.length > 0 && !selectedMinecraftVersions.some(version => modVersions.includes(version))) {
        return false;
    }

    displayModInfo(modData);
    return "completed";
}

function displayModInfo(modData) {
    const modDetails = document.getElementById("modDetails");
    modDetails.innerHTML = `
        <h3>${modData.title}</h3>
        <p><strong>Description:</strong> ${modData.description}</p>
        <p><strong>Author:</strong> ${modData.author}</p>
        <p><strong>Downloads:</strong> ${modData.downloads}</p>
        <p><strong>Project Type:</strong> ${modData.project_type}</p>
        <p><strong>Client-side Support:</strong> ${modData.client_side}</p>
        <p><strong>Server-side Support:</strong> ${modData.server_side}</p>
        <p><strong>Mod Loaders:</strong> ${modData.loaders.join(', ')}</p>
        <p><strong>Supported Minecraft Versions:</strong> ${modData.game_versions.join(', ')}</p>
        <a href="https://modrinth.com/mod/${modData.slug}" target="_blank">View on Modrinth</a>
    `;
}


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}