# Notification Examples

Comprehensive examples of work CLI notification system integration patterns.

## Basic Notification Patterns

### Slack Webhook Integration

```bash
#!/bin/bash
# slack-webhook.sh

data=$(cat)
message=$(echo "$data" | jq -r '.message')
work_item=$(echo "$data" | jq -r '.workItem.title // "N/A"')
priority=$(echo "$data" | jq -r '.workItem.priority // "medium"')
state=$(echo "$data" | jq -r '.workItem.state // "unknown"')

# Format for Slack
slack_payload=$(jq -n \
  --arg text "Work Item Update" \
  --arg message "$message" \
  --arg title "$work_item" \
  --arg priority "$priority" \
  --arg state "$state" \
  '{
    text: $text,
    attachments: [{
      color: (if $priority == "critical" then "danger" elif $priority == "high" then "warning" else "good" end),
      fields: [
        {title: "Work Item", value: $title, short: true},
        {title: "Priority", value: $priority, short: true},
        {title: "State", value: $state, short: true},
        {title: "Message", value: $message, short: false}
      ]
    }]
  }')

curl -X POST "$SLACK_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d "$slack_payload"
```

**Setup:**

```bash
work notify target add slack-alerts --type bash --script ./slack-webhook.sh
work notify send where priority=critical to slack-alerts
```

### Email Notifications via Sendmail

```bash
#!/bin/bash
# email-notification.sh

data=$(cat)
message=$(echo "$data" | jq -r '.message')
work_item=$(echo "$data" | jq -r '.workItem.title // "N/A"')
item_id=$(echo "$data" | jq -r '.workItem.id // "N/A"')
assignee=$(echo "$data" | jq -r '.workItem.assignee // "unassigned"')
timestamp=$(echo "$data" | jq -r '.timestamp')

# Map assignee to email (customize for your team)
case $assignee in
  "alice") email="alice@company.com" ;;
  "bob") email="bob@company.com" ;;
  *) email="team@company.com" ;;
esac

# Send email
{
  echo "To: $email"
  echo "Subject: Work Item Update: $work_item ($item_id)"
  echo "Content-Type: text/html"
  echo ""
  echo "<h3>Work Item Update</h3>"
  echo "<p><strong>Item:</strong> $work_item</p>"
  echo "<p><strong>ID:</strong> $item_id</p>"
  echo "<p><strong>Assignee:</strong> $assignee</p>"
  echo "<p><strong>Message:</strong> $message</p>"
  echo "<p><strong>Timestamp:</strong> $timestamp</p>"
} | sendmail "$email"
```

**Setup:**

```bash
work notify target add email-alerts --type bash --script ./email-notification.sh
work notify send where assignee=alice to email-alerts
```

## Advanced Integration Patterns

### Multi-Service Dashboard Update

```bash
#!/bin/bash
# dashboard-update.sh

data=$(cat)
work_item=$(echo "$data" | jq -r '.workItem')

# Update multiple services
update_grafana() {
  local item_data="$1"
  curl -X POST "http://grafana:3000/api/annotations" \
    -H "Authorization: Bearer $GRAFANA_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$(echo "$item_data" | jq '{
      time: (.updatedAt | fromdateiso8601 * 1000),
      text: .title,
      tags: [.kind, .priority, .state]
    }')"
}

update_datadog() {
  local item_data="$1"
  curl -X POST "https://api.datadoghq.com/api/v1/events" \
    -H "DD-API-KEY: $DATADOG_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$(echo "$item_data" | jq '{
      title: ("Work Item: " + .title),
      text: .description,
      priority: (if .priority == "critical" then "high" else "normal" end),
      tags: ["work-cli", ("kind:" + .kind), ("state:" + .state)]
    }')"
}

log_to_elasticsearch() {
  local item_data="$1"
  curl -X POST "$ELASTICSEARCH_URL/work-items/_doc" \
    -H "Content-Type: application/json" \
    -d "$item_data"
}

# Execute updates
update_grafana "$work_item"
update_datadog "$work_item"
log_to_elasticsearch "$work_item"

echo "Dashboard updates completed"
```

### JIRA Sync Integration

```bash
#!/bin/bash
# jira-sync.sh

data=$(cat)
work_item=$(echo "$data" | jq -r '.workItem')
title=$(echo "$work_item" | jq -r '.title')
description=$(echo "$work_item" | jq -r '.description // ""')
priority=$(echo "$work_item" | jq -r '.priority')
state=$(echo "$work_item" | jq -r '.state')

# Map work CLI priority to JIRA priority
case $priority in
  "critical") jira_priority="1" ;;
  "high") jira_priority="2" ;;
  "medium") jira_priority="3" ;;
  "low") jira_priority="4" ;;
  *) jira_priority="3" ;;
esac

# Map work CLI state to JIRA status
case $state in
  "new") jira_status="To Do" ;;
  "active") jira_status="In Progress" ;;
  "closed") jira_status="Done" ;;
  *) jira_status="To Do" ;;
esac

# Create JIRA issue
jira_payload=$(jq -n \
  --arg project "$JIRA_PROJECT_KEY" \
  --arg summary "$title" \
  --arg description "$description" \
  --arg priority "$jira_priority" \
  '{
    fields: {
      project: {key: $project},
      summary: $summary,
      description: $description,
      issuetype: {name: "Task"},
      priority: {id: $priority}
    }
  }')

curl -X POST "$JIRA_URL/rest/api/2/issue" \
  -H "Authorization: Bearer $JIRA_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$jira_payload"
```

## Team Coordination Patterns

### Daily Standup Automation

```bash
#!/bin/bash
# daily-standup.sh

# Generate standup report for each team member
team_members=("alice" "bob" "charlie" "diana")

for member in "${team_members[@]}"; do
  echo "## $member's Update"

  # Yesterday's completed work
  echo "### Completed:"
  work list where assignee="$member" and state=closed and updated gte "$(date -d 'yesterday' '+%Y-%m-%d')" --format json | \
    jq -r '.[] | "- " + .title'

  # Today's active work
  echo "### In Progress:"
  work list where assignee="$member" and state=active --format json | \
    jq -r '.[] | "- " + .title'

  # Blockers
  echo "### Blockers:"
  work list where assignee="$member" and state=active --format json | \
    jq -r '.[] | select(.priority == "critical") | "- BLOCKED: " + .title'

  echo ""
done > daily-standup-$(date +%Y-%m-%d).md

# Send to team chat
work notify target add standup-bot --type bash --script ./standup-formatter.sh
echo "Daily standup report generated" | work notify send to standup-bot
```

### Sprint Planning Helper

```bash
#!/bin/bash
# sprint-planning.sh

data=$(cat)
message=$(echo "$data" | jq -r '.message')

# Generate sprint planning report
{
  echo "# Sprint Planning Report - $(date)"
  echo ""

  echo "## New Stories (Backlog)"
  work list where kind=story and state=new order by priority desc --format json | \
    jq -r '.[] | "- **" + .title + "** (" + .priority + ")"'

  echo ""
  echo "## Active Epics"
  work list where kind=epic and state=active --format json | \
    jq -r '.[] | "- " + .title + " (" + .id + ")"'

  echo ""
  echo "## Critical Issues"
  work list where kind=bug and priority=critical --format json | \
    jq -r '.[] | "- 🔥 " + .title + " (" + .id + ")"'

  echo ""
  echo "## Team Capacity"
  for member in alice bob charlie diana; do
    active_count=$(work list where assignee="$member" and state=active --format json | jq '. | length')
    echo "- $member: $active_count active items"
  done

} > sprint-planning-$(date +%Y-%m-%d).md

# Post to planning channel
slack_webhook_with_file sprint-planning-$(date +%Y-%m-%d).md
```

## Monitoring and Alerting

### SLA Monitoring

```bash
#!/bin/bash
# sla-monitor.sh

data=$(cat)
work_item=$(echo "$data" | jq -r '.workItem')
priority=$(echo "$work_item" | jq -r '.priority')
created_at=$(echo "$work_item" | jq -r '.createdAt')
state=$(echo "$work_item" | jq -r '.state')

# Calculate age in hours
created_timestamp=$(date -d "$created_at" +%s)
current_timestamp=$(date +%s)
age_hours=$(( (current_timestamp - created_timestamp) / 3600 ))

# Define SLA thresholds
case $priority in
  "critical") sla_hours=4 ;;
  "high") sla_hours=24 ;;
  "medium") sla_hours=72 ;;
  "low") sla_hours=168 ;;  # 1 week
  *) sla_hours=72 ;;
esac

# Check SLA breach
if [ "$state" != "closed" ] && [ $age_hours -gt $sla_hours ]; then
  breach_hours=$((age_hours - sla_hours))

  # Alert to monitoring system
  alert_payload=$(jq -n \
    --arg item_id "$(echo "$work_item" | jq -r '.id')" \
    --arg title "$(echo "$work_item" | jq -r '.title')" \
    --arg priority "$priority" \
    --arg age_hours "$age_hours" \
    --arg sla_hours "$sla_hours" \
    --arg breach_hours "$breach_hours" \
    '{
      alert: "SLA_BREACH",
      item_id: $item_id,
      title: $title,
      priority: $priority,
      age_hours: ($age_hours | tonumber),
      sla_hours: ($sla_hours | tonumber),
      breach_hours: ($breach_hours | tonumber),
      severity: (if $priority == "critical" then "high" else "medium" end)
    }')

  # Send to monitoring system
  curl -X POST "$MONITORING_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$alert_payload"

  echo "SLA breach detected for $item_id (${breach_hours}h overdue)"
else
  echo "Item $item_id within SLA"
fi
```

### Performance Metrics Collection

```bash
#!/bin/bash
# metrics-collector.sh

data=$(cat)
work_item=$(echo "$data" | jq -r '.workItem')
timestamp=$(date +%s)

# Collect metrics
metrics_payload=$(jq -n \
  --arg timestamp "$timestamp" \
  --argjson work_item "$work_item" \
  '{
    timestamp: ($timestamp | tonumber),
    metrics: {
      work_items: {
        created: (if $work_item.state == "new" then 1 else 0 end),
        started: (if $work_item.state == "active" then 1 else 0 end),
        completed: (if $work_item.state == "closed" then 1 else 0 end)
      },
      priority_distribution: {
        critical: (if $work_item.priority == "critical" then 1 else 0 end),
        high: (if $work_item.priority == "high" then 1 else 0 end),
        medium: (if $work_item.priority == "medium" then 1 else 0 end),
        low: (if $work_item.priority == "low" then 1 else 0 end)
      },
      kind_distribution: {
        task: (if $work_item.kind == "task" then 1 else 0 end),
        bug: (if $work_item.kind == "bug" then 1 else 0 end),
        epic: (if $work_item.kind == "epic" then 1 else 0 end),
        story: (if $work_item.kind == "story" then 1 else 0 end)
      }
    }
  }')

# Send to time-series database
curl -X POST "$INFLUXDB_URL/write?db=work_metrics" \
  -d "work_items,priority=${work_item.priority},kind=${work_item.kind} count=1 $timestamp"

# Also send to application metrics endpoint
curl -X POST "$METRICS_ENDPOINT" \
  -H "Content-Type: application/json" \
  -d "$metrics_payload"
```

## Setup Scripts for Common Integrations

### Complete Slack Setup

```bash
#!/bin/bash
# setup-slack-integration.sh

read -p "Enter Slack Webhook URL: " SLACK_WEBHOOK_URL
read -p "Enter notification target name: " TARGET_NAME

# Create notification script
cat > "slack-${TARGET_NAME}.sh" << 'EOF'
#!/bin/bash
data=$(cat)
message=$(echo "$data" | jq -r '.message')
work_item=$(echo "$data" | jq -r '.workItem.title // "N/A"')
priority=$(echo "$data" | jq -r '.workItem.priority // "medium"')

slack_payload=$(jq -n \
  --arg text "Work Item Update: $message" \
  --arg title "$work_item" \
  --arg priority "$priority" \
  '{
    text: $text,
    attachments: [{
      color: (if $priority == "critical" then "danger" elif $priority == "high" then "warning" else "good" end),
      fields: [
        {title: "Work Item", value: $title, short: true},
        {title: "Priority", value: $priority, short: true}
      ]
    }]
  }')

curl -X POST "SLACK_WEBHOOK_URL_PLACEHOLDER" \
  -H "Content-Type: application/json" \
  -d "$slack_payload"
EOF

# Replace placeholder with actual URL
sed -i "s|SLACK_WEBHOOK_URL_PLACEHOLDER|$SLACK_WEBHOOK_URL|g" "slack-${TARGET_NAME}.sh"
chmod +x "slack-${TARGET_NAME}.sh"

# Add to work CLI
work notify target add "$TARGET_NAME" --type bash --script "./slack-${TARGET_NAME}.sh"

echo "Slack integration '$TARGET_NAME' set up successfully!"
echo "Test with: work notify send where priority=high to $TARGET_NAME"
```

### Telegram Bot Setup

```bash
#!/bin/bash
# setup-telegram-bot.sh

echo "Setting up Telegram bot integration..."
echo "1. Message @BotFather on Telegram"
echo "2. Send /newbot and follow instructions"
echo "3. Get your bot token (starts with numbers:letters)"
echo "4. Message @userinfobot to get your chat ID"
echo ""

read -p "Enter bot token: " BOT_TOKEN
read -p "Enter chat ID: " CHAT_ID
read -p "Enter target name: " TARGET_NAME

work notify target add "$TARGET_NAME" --type telegram \
  --bot-token "$BOT_TOKEN" --chat-id "$CHAT_ID"

echo "Telegram bot '$TARGET_NAME' set up successfully!"
echo "Test with: work notify send \"Test message\" to $TARGET_NAME"
```

These examples provide a comprehensive foundation for integrating work CLI notifications with various external services and workflows.
