# 🧪 TESTING GUIDE - All Features Ready!

## Quick Testing Sequence (15 minutes)

### 1️⃣ Pomodoro Loops (3 min)
**Test Steps:**
1. Open Focus Modes → Select Pomodoro
2. Choose 25/5 preset
3. Set loop count to **2 loops**
4. Start session
5. **Verify:** "Loop 1 of 2" displays at top
6. Wait for work timer to complete
7. **Verify:** Break screen appears
8. Skip or complete break
9. **Verify:** "Loop 2 of 2" displays
10. Complete second work session
11. **Verify:** Completion screen shows

**Expected Behavior:**
- Loop counter updates automatically
- Completion screen after final loop
- No completion screen after first loop

---

### 2️⃣ Button Visibility (2 min)
**Test Steps:**
1. Start **Pomodoro** session
2. **Verify:** No Pause button, No Break button
3. **Verify:** Only "Finish" button visible (wider)
4. Close and start **Clock Mode**
5. **Verify:** No Pause button, No Break button
6. Close and start **Flow Mode**
7. **Verify:** All 3 buttons visible (Pause, Break, Finish)

**Expected Behavior:**
- Pomodoro/Clock: Only Finish button
- Other modes: All buttons present
- Finish button expands when others hidden

---

### 3️⃣ Clock Mode Tracking (2 min)
**Test Steps:**
1. Open Focus Modes → Clock Mode
2. Set title: "Deep Work"
3. Start clock
4. **Verify:** Clock displays current time
5. Wait 30 seconds
6. Click **"Finish Session"** button
7. **Verify:** Points awarded notification
8. **Verify:** Redirects to dashboard/completion

**Expected Behavior:**
- Session starts automatically
- Time displays continuously
- Finish button ends session
- Points awarded based on duration

---

### 4️⃣ ToDo Urgency Colors (3 min)
**Test Steps:**
1. Create 3 new todos:
   - "High Priority Task" → Priority: **High**
   - "Medium Priority Task" → Priority: **Medium**  
   - "Low Priority Task" → Priority: **Low**
2. Navigate to Dashboard
3. Swipe to ToDos section
4. **Verify Colors:**
   - High → **Red checkbox** (🔴)
   - Medium → **Orange/Yellow checkbox** (🟠)
   - Low → **Green checkbox** (🟢)
5. Complete one todo
6. **Verify:** Completed shows green checkmark

**Expected Colors:**
- 🔴 Red: High urgency
- 🟠 Orange: Medium urgency
- 🟢 Green: Low urgency
- ⚪ Gray: No urgency set

---

### 5️⃣ Social Hours Format (2 min)
**Test Steps:**
1. Go to Social Tracking
2. Select "Time Outside"
3. Enter: **2.5** in input field
4. **Verify:** Display shows "hours" label
5. Save entry
6. Check stats/entries
7. **Verify:** Stored as 150 minutes internally
8. Try entering: **0.5** (30 min)
9. Try entering: **1.0** (60 min)
10. **Verify:** All decimals work correctly

**Expected Behavior:**
- Input accepts decimal (2.5, 0.5, 1.0)
- Label says "hours" not "minutes"
- Placeholder: "0.0"
- Converts to minutes for storage
- Stats show hours correctly

---

## 🚨 Bug Testing (Edge Cases)

### Pomodoro Edge Cases
- [ ] Select 1 loop → Should complete immediately after work
- [ ] Select 8 loops → Counter should go up to "Loop 8 of 8"
- [ ] Early finish during loop 2 → Should complete all

### Clock Mode Edge Cases
- [ ] Start and immediately finish → Should award 0-1 min
- [ ] Leave for 5 minutes → Should calculate correct duration
- [ ] Close without finishing → Session should be saved

### ToDo Edge Cases
- [ ] Old todos without urgency → Should show gray
- [ ] Complete high urgency todo → Should show green
- [ ] Create todo without priority → Should default to gray

### Social Hours Edge Cases
- [ ] Enter "0" → Should accept
- [ ] Enter "10.5" → Should work
- [ ] Enter "." alone → Should handle gracefully
- [ ] Enter letters → Should filter out

---

## ✅ SUCCESS CRITERIA

**All tests pass if:**
1. Pomodoro loops complete correctly ✅
2. Buttons hide/show based on mode ✅
3. Clock mode awards points ✅
4. Todo colors match urgency ✅
5. Hours input accepts decimals ✅
6. No crashes or errors ✅
7. Performance feels smooth ✅

---

## 🐛 If You Find Bugs

### Report Format:
```
Feature: [Pomodoro Loops / Clock Mode / etc.]
Steps to Reproduce:
1. Do this
2. Do that
Expected: [What should happen]
Actual: [What happened]
Error Message: [If any]
```

### Common Issues & Fixes:

**Issue:** Loop counter not updating
- **Fix:** Check if `currentLoop` state updates in `startNextPomodoro()`

**Issue:** Urgency colors not showing
- **Fix:** Check if todos have `urgency` or `priority` field
- **Fix:** Verify `getUrgencyColor()` is called

**Issue:** Hours input shows NaN
- **Fix:** Check `parseFloat()` and `isNaN()` logic
- **Fix:** Ensure initial state is valid number

**Issue:** Clock mode doesn't award points
- **Fix:** Verify `sessionStartTime` is set
- **Fix:** Check `focusSessionService.completeSession()` call

---

## 📊 Performance Checks

### Loading Times
- Dashboard load: **< 2 seconds** ✅
- Focus mode start: **< 1 second** ✅
- Todo creation: **< 500ms** ✅
- Social entry save: **< 500ms** ✅

### Smoothness
- Scroll dashboard: **60 FPS** ✅
- Swipe sections: **No lag** ✅
- Timer countdown: **Accurate** ✅
- Button taps: **Instant feedback** ✅

---

## 🎯 Final Checklist

Before declaring "DONE":
- [ ] All 5 main features tested
- [ ] Edge cases handled gracefully
- [ ] No TypeScript errors
- [ ] No runtime crashes
- [ ] Performance feels smooth
- [ ] UI looks polished
- [ ] Colors/spacing correct
- [ ] Navigation works
- [ ] Data persists correctly
- [ ] Points awarded properly

---

## 🚀 READY TO SHIP!

Once all tests pass, you're ready to:
1. Build production version
2. Test on real device
3. Deploy to TestFlight/Play Store Beta
4. Collect user feedback
5. Iterate and improve!

**Estimated Total Testing Time:** 15-20 minutes  
**Difficulty:** Easy (straightforward tests)  
**Required:** Real device or emulator with Expo Go

---

**LET'S TEST! 🔥**
