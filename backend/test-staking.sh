#!/bin/bash
set -e

echo "🧪 Testing Token-Based Staking System"

# Get tokens for test users
echo "🔑 Getting auth tokens..."
TOKEN1=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player1","password":"Test123456"}' | jq -r '.token')

TOKEN2=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"player2","password":"Test123456"}' | jq -r '.token')

if [ "$TOKEN1" = "null" ] || [ "$TOKEN2" = "null" ]; then
  echo "❌ Failed to get auth tokens. Make sure users exist and passwords are correct."
  exit 1
fi

echo "✅ Auth tokens obtained"

# Add tokens to wallets
echo "💰 Adding test tokens..."
curl -s -X POST http://localhost:3001/api/wallet/deposit \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}' > /dev/null

curl -s -X POST http://localhost:3001/api/wallet/deposit \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}' > /dev/null

echo "✅ 5000 tokens added to each wallet"

# Check initial balances
BAL1=$(curl -s -H "Authorization: Bearer $TOKEN1" http://localhost:3001/api/wallet/balance | jq -r '.balance')
BAL2=$(curl -s -H "Authorization: Bearer $TOKEN2" http://localhost:3001/api/wallet/balance | jq -r '.balance')
echo "💰 Initial balances: player1=$BAL1, player2=$BAL2"

# Create and join game
echo "🎮 Creating game..."
GAME=$(curl -s -X POST http://localhost:3001/api/games/create \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{}' | jq -r '.gameSession.game_code')

if [ "$GAME" = "null" ]; then
  echo "❌ Failed to create game"
  exit 1
fi

echo "✅ Game created: $GAME"

echo "👥 Player 2 joining game..."
curl -s -X POST http://localhost:3001/api/games/join \
  -H "Authorization: Bearer $TOKEN2" \
  -H "Content-Type: application/json" \
  -d "{\"gameCode\":\"$GAME\"}" > /dev/null

echo "✅ Both players in game"

# Set stake
echo "💸 Setting stake (1000 tokens)..."
STAKE_RESULT=$(curl -s -X POST http://localhost:3001/api/games/$GAME/stake \
  -H "Authorization: Bearer $TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{"stakeTokens": 1000}')

echo "✅ Stake set: $(echo $STAKE_RESULT | jq -r '.message')"

# Check balances after escrow
BAL1_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN1" http://localhost:3001/api/wallet/balance | jq -r '.balance')
BAL2_AFTER=$(curl -s -H "Authorization: Bearer $TOKEN2" http://localhost:3001/api/wallet/balance | jq -r '.balance')
echo "💰 Balances after escrow: player1=$BAL1_AFTER, player2=$BAL2_AFTER"

# Check transaction history
echo "📊 Recent transactions for player1:"
curl -s -H "Authorization: Bearer $TOKEN1" http://localhost:3001/api/wallet/transactions?limit=3 | jq -r '.transactions[] | "\(.kind): \(.direction) \(.amount) tokens (\(.created_at))"'

echo ""
echo "🎯 Test Results:"
echo "- Initial balances: player1=$BAL1, player2=$BAL2"
echo "- After escrow: player1=$BAL1_AFTER, player2=$BAL2_AFTER"
echo "- Expected: Both should have 1000 less (1000 each held in escrow)"
echo ""
echo "🎮 Game Code: $GAME"
echo "💡 Try abandoning the game to test payouts:"
echo "   curl -X POST http://localhost:3001/api/games/$GAME/abandon -H \"Authorization: Bearer \$TOKEN1\""
