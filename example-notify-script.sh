#!/bin/bash

# Read JSON data from stdin
notification_data=$(cat)

# Parse the JSON (requires jq)
message=$(echo "$notification_data" | jq -r '.message')
work_item_id=$(echo "$notification_data" | jq -r '.workItem.id // "N/A"')
work_item_title=$(echo "$notification_data" | jq -r '.workItem.title // "N/A"')

# Do something with the notification
echo "Notification received: $message"
echo "Work Item: $work_item_id - $work_item_title"

# Example: Log to file
echo "$(date): $message - $work_item_title" >> /tmp/work-notifications.log

# Example: Send to external service
# curl -X POST https://your-webhook.com/notify \
#   -H "Content-Type: application/json" \
#   -d "$notification_data"

# Exit 0 for success, non-zero for failure
exit 0
