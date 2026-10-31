# Hardin variant

`main` tracks upstream. `hardin-main` is the integration and release branch.
The Android application ID is `com.hardin.skylit`, labelled Hardin Skylit.
Implementation classes retain their upstream Java namespace to minimize merge conflicts.
It installs alongside the author-signed original; Android HOME selects the desired variant.

The updater reads published releases from `williamrexhardin/skylit`, checks the same
signer/package/version/hash boundaries, and additionally requires update metadata
with `sourceBranch: hardin-main`. Source pushes alone are not app releases.
Build and publish only clean, pushed hardin-main commits, signed with the retained
Hardin key. Increment versionCode/versionName for each release. The private
`williamrexhardin/skylit-deployment` repo provides the local deployment scripts.

Household settings never enter the public APK. Migration tooling exports only
Skylit dashboard localStorage and non-secret calendar labels through an explicitly
enabled local WebView inspector. Feed URLs are supplied privately and stored only
on the device. Cookies, Google sign-in sessions, mail passwords, and cached media
are not copied. Disable inspection and remove ADB forwarding after transfer.
Keep the original app and its private data for rollback.
