# Android phone radio simulator

Start `./run-sajag.sh` from the parent workspace. Connect the phone by USB,
enable USB debugging and authorize the computer. On the computer:

```sh
adb devices
adb reverse tcp:4000 tcp:4000
```

Open `http://localhost:4000/sensor` in Android Chrome. Use Chrome's menu →
Add to Home screen / Install app, or the page's install button when available.
This installs a browser app, not an APK or a hardware LoRa driver. Keep USB
connected, the computer running and the page foregrounded. Re-run adb reverse
after reconnecting. If the API uses a different host port, change the second
port in the adb command.

Send a LoRa message in the send/receive panel. TX means queued; a received
RX entry means the gateway reply traversed the simulated downlink. Both legs
use SimPy airtime, backoff, collisions and configured loss. A missing reply
can mean either leg was lost. Inbox entries are bounded and disappear when
the gateway restarts. The current page uses a shared demo device ID.

The gateway automatically echoes messages; these test messages never enter
the disaster telemetry ingestion or trigger alerts. Telemetry environment
controls still use the database and configured alert workflows.

The browser app does not operate offline: no API calls or sensor packets are
cached. Actual over-the-air LoRa requires a LoRa transceiver.
