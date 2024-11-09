{
  "targets": [
    {
      "target_name": "audiocapture",
      "sources": [
        "../native/audiocapture.cpp"
      ],
      "include_dirs": [
        "<!(node -p \"require('node-addon-api').include\")"
      ],
      "defines": ["NAPI_VERSION=3"],
      "libraries": ["ole32.lib", "uuid.lib"]
    }
  ]
}
