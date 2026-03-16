import { NextResponse } from "next/server";
import fs from "fs";

const GITHUB_RELEASE_API =
    "https://api.github.com/repos/Mathi4Raja/Acad-Intern/releases/tags/mobile-latest";

export async function GET() {
    // Local dev override: set APK_PATH in .env.local to serve the file directly
    const localPath = process.env.APK_PATH;
    if (localPath && fs.existsSync(localPath)) {
        const stat = fs.statSync(localPath);
        const fileStream = fs.createReadStream(localPath);

        const readableStream = new ReadableStream({
            start(controller) {
                fileStream.on("data", (chunk) => controller.enqueue(chunk));
                fileStream.on("end", () => controller.close());
                fileStream.on("error", (err) => controller.error(err));
            },
            cancel() {
                fileStream.destroy();
            },
        });

        return new NextResponse(readableStream, {
            headers: {
                "Content-Type": "application/vnd.android.package-archive",
                "Content-Disposition": 'attachment; filename="acad-intern.apk"',
                "Content-Length": stat.size.toString(),
            },
        });
    }

    // Production: use the GitHub API to locate the APK asset, then get its
    // signed CDN URL via the asset download endpoint (redirect: "manual").
    const token = process.env.GITHUB_TOKEN;
    const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    // Step 1: get the release and find the APK asset
    const releaseRes = await fetch(GITHUB_RELEASE_API, { headers });
    if (!releaseRes.ok) {
        const body = await releaseRes.text();
        return new NextResponse(
            `GitHub API error ${releaseRes.status}: ${body}`,
            { status: 502 }
        );
    }

    const release = await releaseRes.json();
    const asset = (release.assets as { name: string; url: string }[])?.find(
        (a) => a.name === "acad-intern.apk"
    );
    if (!asset) {
        const names = (release.assets as { name: string }[])?.map((a) => a.name) ?? [];
        return new NextResponse(
            `APK not found in release. Assets: ${JSON.stringify(names)}`,
            { status: 502 }
        );
    }

    // Step 2: hit the asset API URL with Accept: octet-stream — GitHub
    // responds with a 302 redirect to a short-lived signed CDN URL.
    const assetRes = await fetch(asset.url, {
        headers: { ...headers, Accept: "application/octet-stream" },
        redirect: "manual",
    });

    const signedUrl = assetRes.headers.get("location");
    if (!signedUrl) {
        return new NextResponse("APK not available", { status: 502 });
    }

    return NextResponse.redirect(signedUrl);
}
