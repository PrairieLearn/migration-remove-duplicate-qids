cat <<-\EOF
**TL;DR: You will need to fix some of your assessments to be able to sync your course to PrairieLearn in the future. Just click “merge” to automatically fix this. Read on for more context.**

In the coming weeks, we will be deploying [new code](https://github.com/PrairieLearn/PrairieLearn/pull/1581) for PrairieLearn that significantly increases the speed of course syncing. As a part of that, we took the time to add some code to better validate assessments. Part of that is ensuring that a question appears at most once in an assessment, as PrairieLearn does not support including a question more than once per assessment.

Your course has been identified as having one or more assessments that includes a question more than once in an exam. You will need to fix these assessments in order to sync your course in the future. This is an automated PR that fixes these assessments for you.

## What do I need to do?

If you want your assessments to work as they did before, you can simply merge this PR. With the old syncing code, PrairieLearn would silently drop all but the last occurrence of any duplicated questions. This PR simply follows that logic, removing all but the last occurrence of any question in an assessment.

However, if this was not what you intended in your assessments, you should manually review and fix each assessment. You'll also need to take manual action if your assessment configurations are generated with some type of build script or if you aren't happy with the automatic JSON formatting that was used in this PR.

If you have any questions, please feel free to reach out in the #pl-help channel on the PrairieLearn Slack!

For your convenience, here is a list of each assessment (specified as **[course instance] - [assessment id]**) and the questions that appear more than once in each assessment:

EOF

cat $SHEPHERD_DATA_DIR/dupeslist.md
