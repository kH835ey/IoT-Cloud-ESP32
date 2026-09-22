sed -i -e '/const esp32SchoolLightsCode = `/!b' -e '/^`;/!d' src/components/FirmwareView.tsx
