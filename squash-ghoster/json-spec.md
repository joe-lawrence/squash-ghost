---

## **Squash Ghosting Workout JSON Format Definition**

The output JSON represents a hierarchical structure of a squash ghosting workout, including global settings, patterns, and individual shots or messages. This specification reflects the current implementation as of the latest version.

---

### **Configuration Inheritance**

The workout system supports inheritance of configuration properties from higher levels to lower levels. Properties can be overridden at any level, and if omitted, they inherit from the parent level.

#### **Inheritable Properties**

* **voice** (string, optional): The name of the Text-to-Speech voice to use. Overrides parent voice setting.
* **speechRate** (number, optional): The speech rate for Text-to-Speech, a float between 0.5 and 1.5. Overrides parent speech rate setting.
* **interval** (number, optional): The duration of the shot timer in seconds (3.0-8.0, step 0.1s). Overrides parent interval setting.
* **intervalOffsetType** (string, optional): Type of interval offset. Overrides parent setting.
  * "fixed": A single fixed offset applied.
  * "random": A random offset within a range.
* **intervalOffset** (object, optional): Overrides parent intervalOffset setting.
  * **min** (number, required): The minimum offset for the interval in seconds (-2.0 to +2.0). If intervalOffsetType is "fixed", min and max will be the same value.
  * **max** (number, required): The maximum offset for the interval in seconds (-2.0 to +2.0).
* **autoVoiceSplitStep** (boolean, optional): If true, splitStepSpeed is automatically determined by the system. Overrides parent setting.
* **shotAnnouncementLeadTime** (number, optional): Time in seconds before the shot period expires that the shot is announced (1.0 to interval value, step 0.1s). Overrides parent setting.
* **splitStepSpeed** (string, optional): Defines the split-step sound effect speed. If autoVoiceSplitStep is true, this may be overridden. Overrides parent setting.
  * "none"
  * "slow"
  * "medium"
  * "fast"
  * "random"
  * "auto-scale"

#### **Non-Inheritable Properties**

* **iterationType** (string): Controls iteration order but operates on different lists at each level:
  * **Workout level**: Controls iteration over patterns
  * **Pattern level**: Controls iteration over shots/messages within that pattern
  * **Note**: Pattern iterationType is NOT inherited from workout - each pattern must define its own
* **limits** (object): Controls termination conditions but operates on different lists at each level:
  * **Workout level**: Controls termination based on pattern visits
  * **Pattern level**: Controls termination based on shot/message visits within that pattern
  * **Note**: Pattern limits are NOT inherited from workout - each pattern must define its own
* **repeatCount** (integer): Pattern-specific property that controls how many times a pattern runs consecutively

#### **Inheritance Hierarchy**
```
Workout (defines defaults)
├── voice, speechRate
├── interval, intervalOffsetType, intervalOffset, autoVoiceSplitStep, shotAnnouncementLeadTime, splitStepSpeed
├── iterationType (operates on patterns)
└── limits (operates on patterns)
    └── Pattern (can override workout defaults)
        ├── voice, speechRate (overrides workout)
        ├── interval, intervalOffsetType, intervalOffset, autoVoiceSplitStep, shotAnnouncementLeadTime, splitStepSpeed (overrides workout)
        ├── iterationType (operates on shots/messages - NOT inherited from workout)
        ├── limits (operates on shots/messages - NOT inherited from workout)
        └── repeatCount (pattern-specific, applies to the pattern's entire sequence of entries)
            └── Shot (can override pattern defaults)
                ├── voice, speechRate (overrides pattern)
                ├── interval, intervalOffsetType, intervalOffset, autoVoiceSplitStep, shotAnnouncementLeadTime, splitStepSpeed (overrides pattern)
                └── repeatCount (shot-specific, applies to the individual shot, not inherited)

```

---

### **1\. Root Object: Workout**

The top-level JSON object represents the entire workout.

```json
{
  "type": "Workout",
  "name": "string",
  "config": {
    "iterationType": "in-order" | "shuffle",
    "limits": {
      "type": "all-shots" | "shot-limit" | "time-limit",
      "value": "integer" | "string" | null
    },
    "voice": "string",
    "speechRate": "number",
    "interval": "number",
    "intervalOffsetType": "fixed" | "random",
    "intervalOffset": {
      "min": "number",
      "max": "number"
    },
    "autoVoiceSplitStep": "boolean",
    "shotAnnouncementLeadTime": "number",
    "splitStepSpeed": "none" | "slow" | "medium" | "fast" | "random" | "auto-scale"
  },
  "patterns": [
    // Array of Pattern objects
  ]
}
```

#### **Properties**

* **type** (string, required): Must be "Workout".
* **name** (string, required): The name of the workout.
* **config** (object, required):
  * **iterationType** (string, required): Specifies the order of patterns.
    * "in-order": Patterns are executed in their display order.
    * "shuffle": Patterns are executed in a randomized order.
  * **limits** (object, required):
    * **type** (string, required): Defines how the workout terminates.
      * "all-shots": Workout ends after all patterns are visited.
      * "shot-limit": Workout ends after a maximum number of pattern entries (value) are visited.
      * "time-limit": Workout ends after a maximum time (value) has elapsed.
    * **value** (union, required):
      * If limits.type is "shot-limit", this is an **integer** (1-200).
      * If limits.type is "time-limit", this is a **string** in MM:SS format (e.g., "01:00", "30:00").
      * If limits.type is "all-shots", this field is **null**.
  * **voice** (string, optional): The name of the Text-to-Speech voice to use. Can be set to "Default" to use the browser's default voice, or omitted entirely to inherit from parent level. If omitted at the workout level, defaults to "Default".
  * **speechRate** (number, optional): The speech rate for Text-to-Speech, a float between 0.5 and 1.5. If omitted, inherits from parent level or defaults to 1.0.
  * **interval** (number, optional): Default shot timer duration in seconds (3.0-8.0, step 0.1s).
  * **intervalOffsetType** (string, optional): Default type of interval offset.
    * "fixed": A single fixed offset applied.
    * "random": A random offset within a range.
  * **intervalOffset** (object, optional): Default interval offset settings.
    * **min** (number, required): The minimum offset for the interval in seconds (-2.0 to +2.0).
    * **max** (number, required): The maximum offset for the interval in seconds (-2.0 to +2.0).
  * **autoVoiceSplitStep** (boolean, optional): Default setting for automatic split-step speed determination.
  * **shotAnnouncementLeadTime** (number, optional): Default time in seconds before shot period expires for announcement (1.0 to interval value, step 0.1s).
  * **splitStepSpeed** (string, optional): Default split-step sound effect speed.
    * "none"
    * "slow"
    * "medium"
    * "fast"
    * "random"
    * "auto-scale"
* **patterns** (array of Pattern objects, required): An array containing at least one Pattern object.

---

### **2\. Pattern Object**

Represents a sequence of shots or messages within a workout.

```json
{
  "type": "Pattern",
  "id": "string",
  "name": "string",
  "positionType": "normal" | "linked" | "last" | "1" | "2" | "3" | "...",
  "config": {
    "iterationType": "in-order" | "shuffle",
    "limits": {
      "type": "all-shots" | "shot-limit" | "time-limit",
      "value": "integer" | "string" | null
    },
    "repeatCount": "integer",
    "voice": "string",
    "speechRate": "number",
    "interval": "number",
    "intervalOffsetType": "fixed" | "random",
    "intervalOffset": {
      "min": "number",
      "max": "number"
    },
    "autoVoiceSplitStep": "boolean",
    "shotAnnouncementLeadTime": "number",
    "splitStepSpeed": "none" | "slow" | "medium" | "fast" | "random" | "auto-scale"
  },
  "entries": [
    // Array of Shot or Message objects
  ]
}
```

#### **Properties**

* **type** (string, required): Must be "Pattern".
* **id** (string, required): A unique identifier for the pattern.
* **name** (string, required): The name of the pattern.
* **positionType** (string, required): Defines the positioning/ordering behavior within its parent context.
  * "normal": Normal in-order execution.
  * "linked": Must follow the preceding entry (linked with previous).
  * "last": Locked to the last position in iteration.
  * "1", "2", "3", etc.: Locked to a specific position number in iteration.
* **config** (object, required):
  * **iterationType** (string, required): Specifies the order of entries within this pattern. NOT inherited from workout - each pattern must define its own.
    * "in-order": Entries are executed in their display order.
    * "shuffle": Entries are executed in a randomized order.
  * **limits** (object, required): Defines how this pattern terminates. NOT inherited from workout - each pattern must define its own.
    * **type** (string, required): Defines how the pattern terminates.
      * "all-shots": Pattern ends after all child entries are visited.
      * "shot-limit": Pattern ends after a maximum number of child entries (value) are visited.
      * "time-limit": Pattern ends after a maximum time (value) has elapsed.
    * **value** (union, required):
      * If limits.type is "shot-limit", this is an **integer** (1-200).
      * If limits.type is "time-limit", this is a **string** in MM:SS format (e.g., "01:00", "30:00").
      * If limits.type is "all-shots", this field is **null**.
  * **repeatCount** (integer | object, optional): How many times this pattern should be consecutively run. This property is not inherited.
    
    **Fixed repeat (object)**: An object specifying the exact number of repeats:
    ```json
    {
      "type": "fixed",
      "count": 3
    }
    ```
    This will run the pattern exactly 3 times. Range: 1-10.
    
    **Random repeat (object)**: An object specifying a random range of repeats:
    ```json
    {
      "type": "random",
      "min": 2,
      "max": 5
    }
    ```
    This will randomly select a repeat count between min and max (inclusive) each time the workout is generated. Range: min 0-10, max 1-10.
    
    **Legacy support**: For backward compatibility, integer values are still supported and treated as fixed repeats:
    ```json
    "repeatCount": 3
    ```
    This is equivalent to `{"type": "fixed", "count": 3}`.
     
     Note on number formatting: repeat counts are integers. In JSON they may be represented without a decimal (e.g., `3` instead of `3.0`). The `count`, `min`, and `max` fields should be integers; both `3` and `3.0` parse as numbers and are accepted by the implementation.
    
    If omitted, defaults to 1 (no repeats).
  * **voice** (string, optional): Overrides parent voice setting. The name of the Text-to-Speech voice to use.
  * **speechRate** (number, optional): Overrides parent speech rate setting. A float between 0.5 and 1.5.
  * **interval** (number, optional): Overrides workout-level shot timer duration.
  * **intervalOffsetType** (string, optional): Overrides workout-level interval offset type.
  * **intervalOffset** (object, optional): Overrides workout-level interval offset settings.
  * **autoVoiceSplitStep** (boolean, optional): Overrides workout-level automatic split-step setting.
  * **shotAnnouncementLeadTime** (number, optional): Overrides workout-level shot announcement lead time.
  * **splitStepSpeed** (string, optional): Overrides workout-level split-step speed setting.
* **entries** (array of Shot or Message objects, required): An array containing at least one Shot or Message object.

---

### **3\. Shot Object**

Represents a single shot within a pattern.

```json
{
  "type": "Shot",
  "id": "string",
  "name": "string",
  "positionType": "normal" | "linked" | "last" | "1" | "2" | "3" | "...",
  "config": {
    "repeatCount": "integer",
    "interval": "number",
    "intervalOffsetType": "fixed" | "random",
    "intervalOffset": {
      "min": "number",
      "max": "number"
    },
    "autoVoiceSplitStep": "boolean",
    "shotAnnouncementLeadTime": "number",
    "splitStepSpeed": "none" | "slow" | "medium" | "fast" | "random" | "auto-scale",
    "voice": "string",
    "speechRate": "number"
  }
}
```

#### **Properties**

* **type** (string, required): Must be "Shot".
* **id** (string, required): A unique identifier for the shot.
* **name** (string, optional): The name of the shot (e.g., "Boast", "Forehand Drive"). If omitted or empty, the shot will be silent during TTS announcements.
* **positionType** (string, required): Defines the positioning/ordering behavior within its parent context.
  * "normal": Normal in-order execution.
  * "linked": Must follow the preceding entry (linked with previous).
  * "last": Locked to the last position in iteration.
  * "1", "2", "3", etc.: Locked to a specific position number in iteration.
* **config** (object, required):
  * **repeatCount** (integer | object, optional): Specifies how many times this individual shot should be executed consecutively before moving to the next entry in the pattern. This property is not inherited.
    
    **Fixed repeat (object)**: An object specifying the exact number of repeats:
    ```json
    {
      "type": "fixed",
      "count": 3
    }
    ```
    This will execute the shot exactly 3 times consecutively. Range: 1-10.
    
    **Random repeat (object)**: An object specifying a random range of repeats:
    ```json
    {
      "type": "random",
      "min": 2,
      "max": 5
    }
    ```
    This will randomly select a repeat count between min and max (inclusive) each time the workout is generated. Range: min 0-10, max 1-10.
    
    **Legacy support**: For backward compatibility, integer values are still supported and treated as fixed repeats:
    ```json
    "repeatCount": 3
    ```
    This is equivalent to `{"type": "fixed", "count": 3}`.
     
     Note on number formatting: repeat counts are integers. In JSON they may be represented without a decimal (e.g., `3` instead of `3.0`). The `min` and `max` fields should be integers; both `3` and `3.0` parse as numbers and are accepted by the implementation.
    
    If omitted, defaults to 1 (no repeats).
  * **interval** (number, optional): The duration of the shot timer in seconds (3.0-8.0, step 0.1s). **Note: Shots use numeric seconds, Messages use "MM:SS" strings.** Overrides pattern-level interval setting.
  * **intervalOffsetType** (string, optional): Type of interval offset. Overrides pattern-level setting.
    * "fixed": A single fixed offset applied.
    * "random": A random offset within a range.
  * **intervalOffset** (object, optional): Overrides pattern-level intervalOffset setting.
    * **min** (number, required): The minimum offset for the interval in seconds (-2.0 to +2.0). If intervalOffsetType is "fixed", min and max will be the same value.
    * **max** (number, required): The maximum offset for the interval in seconds (-2.0 to +2.0).
  * **autoVoiceSplitStep** (boolean, optional): If true, splitStepSpeed is automatically determined by the system. Overrides pattern-level setting.
  * **shotAnnouncementLeadTime** (number, optional): Time in seconds before the shot period expires that the shot is announced (1.0 to interval value, step 0.1s). Overrides pattern-level setting.
  * **splitStepSpeed** (string, optional): Defines the split-step sound effect speed. If autoVoiceSplitStep is true, this may be overridden. Overrides pattern-level setting.
    * "none"
    * "slow"
    * "medium"
    * "fast"
    * "random"
    * "auto-scale"
  * **voice** (string, optional): Overrides parent voice setting. The name of the Text-to-Speech voice to use.
  * **speechRate** (number, optional): Overrides parent speech rate setting. A float between 0.5 and 1.5.

---

### **4\. Message Object**

Represents a message announcement within a pattern.

```json
{
  "type": "Message",
  "id": "string",
  "name": "string",
  "positionType": "normal" | "linked" | "last" | "1" | "2" | "3" | "...",
  "config": {
    "message": "string",
    "interval": "string",
    "intervalType": "fixed" | "additional",
    "countdown": "boolean",
    "skipAtEndOfWorkout": "boolean",
    "voice": "string",
    "speechRate": "number"
  }
}
```

#### **Properties**

* **type** (string, required): Must be "Message".
* **id** (string, required): A unique identifier for the message.
* **name** (string, required): A descriptive name for the message.
* **positionType** (string, required): Defines the positioning/ordering behavior within its parent context.
  * "normal": Normal in-order execution.
  * "linked": Must follow the preceding entry (linked with previous).
  * "last": Locked to the last position in iteration.
  * "1", "2", "3", etc.: Locked to a specific position number in iteration.
* **config** (object, required):
  * **message** (string, required): The announcement message text.
  * **interval** (string, required): The interval duration in MM:SS format (e.g., "00:00" to "05:00"). **Note: "02:00" = 2 minutes, "00:30" = 30 seconds.** The meaning depends on intervalType.
  * **intervalType** (string, optional): Defines how the interval value is interpreted. If omitted, defaults to "fixed".
    * "fixed": The total message duration is max(TTS duration, interval value). If TTS < interval, remaining time = interval - TTS.
    * "additional": The total message duration is TTS duration + interval value. Remaining time always equals interval value.
  * **countdown** (boolean, optional): Whether to show a countdown timer during the message. If omitted, defaults to false. In rocket-mode preview, when enabled, shows countdown timing for the last 10 seconds (or remaining duration if less than 10 seconds).
  * **skipAtEndOfWorkout** (boolean, required): If true, the message will not be announced if it's the last entry of the workout.
  * **voice** (string, optional): Overrides parent voice setting. The name of the Text-to-Speech voice to use.
  * **speechRate** (number, optional): Overrides parent speech rate setting. A float between 0.5 and 1.5.

---

### **Implementation Notes**

#### **Position Type Mapping**
The current implementation uses positionType values to define behavior:
- **Normal**: Default in-order execution → `positionType: "normal"`
- **Linked**: Must follow the previous entry → `positionType: "linked"`
- **Last**: Locked to the last position → `positionType: "last"`
- **Position Lock**: Locked to a specific position → `positionType: "1"`, `"2"`, `"3"`, etc.

#### **Configuration Inheritance**
Configurations at lower levels (Pattern, Shot/Message) override those at higher levels (Workout, Pattern). If a configuration property is omitted at a lower level, the effective value should be inherited from its parent.

#### **Implied Values**
* **repeatCount**: If omitted, defaults to 1. This is the most common case, so it's only necessary to specify when the count is greater than 1.

#### **Empty Config Objects**
* **config**: If the config object is empty (contains no properties), it can be omitted entirely. This indicates that all settings should use their inherited/default values.

#### **Time Formats**
**Important**: Different entry types use different interval formats:
- **Shot intervals**: Numeric seconds (e.g., `5.0`, `3.5`) - range 3.0-8.0 seconds
- **Message intervals**: String MM:SS format (e.g., `"02:00"`, `"00:30"`) - range "00:00" to "05:00"
- **Time limits**: String MM:SS format (e.g., `"60:00"` for 60 minutes)

The implementation handles conversion between seconds and MM:SS format internally.

#### **Voice and Speech Rate**
* **voice**: Can be omitted entirely (inherits from parent), set to "Default" (uses browser default), or set to a specific voice name.
* **speechRate**: Can be omitted entirely (inherits from parent or defaults to 1.0) or set to a specific rate between 0.5 and 1.5.
* When voice settings are disabled at any level, both properties are typically omitted from the JSON output.

#### **Rocket-Mode Preview Timing**
When rocket-mode is enabled (configuration unlocked), the preview displays detailed timing information for messages:

- **Time Formatting**: Remaining time durations >= 60 seconds are displayed in "M:SS min" format (e.g., "1:30 min"), while durations < 60 seconds are shown in seconds (e.g., "45.0s").
- **Additional Mode Calculation**: When intervalType is "additional", the total message time equals estimated TTS duration + interval value, with remaining time always equal to the interval value.
- **Countdown Display**: When countdown is enabled, an additional countdown line appears showing the timing for the last 10 seconds. If remaining time is less than 10 seconds, the countdown duration equals the remaining time.

#### **File Format**
Workout files should be saved with the `.workout.json` extension for consistency and recognition by other applications in the ecosystem.

#### **Version Compatibility**
This specification reflects the current implementation. Future versions should maintain backward compatibility or provide migration tools for existing workout files.

---

### **Example Workout File**

```json
{
  "type": "Workout",
  "name": "My Squash Workout",
  "config": {
    "iterationType": "in-order",
    "limits": {
      "type": "all-shots",
      "value": null
    },
    "voice": "Microsoft Zira - English (United States)",
    "speechRate": 1.0,
    "interval": 5.0,
    "intervalOffsetType": "fixed",
    "intervalOffset": {
      "min": 0.0,
      "max": 0.0
    },
    "autoVoiceSplitStep": true,
    "shotAnnouncementLeadTime": 2.5,
    "splitStepSpeed": "auto-scale"
  },
  "patterns": [
    {
      "type": "Pattern",
      "id": "pattern_001",
      "name": "Warm-up",
      "positionType": "normal",
      "config": {
        "iterationType": "in-order",
        "limits": {
          "type": "all-shots",
          "value": null
        },
        "interval": 4.5
      },
      "entries": [
        {
          "type": "Shot",
          "id": "shot_001",
          "name": "Forehand Drive",
          "positionType": "normal"
        },
        {
          "type": "Shot",
          "id": "shot_002",
          "name": "Backhand Drive",
          "positionType": "normal",
          "config": {
            "interval": 6.0
          }
        },
        {
          "type": "Message",
          "id": "msg_001",
          "name": "Rest Period",
          "positionType": "linked",
          "config": {
            "message": "Take a 30 second break",
            "interval": "00:30",
            "skipAtEndOfWorkout": false
          }
        }
      ]
    }
  ]
}
```

---

### **Common Shot Names Reference**

The following shot names are commonly used in squash ghosting workouts and can be referenced when creating sample JSON files:

#### **Court Position Names**
```
Front Left, Front Right, Mid Left, Mid Right, Back Left, Back Right
```

#### **Numeric Position Names**
```
1L, 1R, 2L, 2R, 3L, 3R, 4L, 4R, 5L, 5R, 6L, 6R
```

#### **Technical Shot Names**
```
Forehand Drive, Backhand Drive, Forehand Drop, Backhand Drop,
Forehand Boast, Backhand Boast, Forehand Lob, Backhand Lob,
Forehand Cross Court, Backhand Cross Court, Forehand Straight, Backhand Straight,
Forehand Kill, Backhand Kill, Forehand Volley, Backhand Volley
```

These names can be used in the `name` field of Shot objects to create realistic and varied workout patterns.

---

This JSON format provides a comprehensive and implementation-accurate representation of the squash ghosting workout structure and its configurable properties.

