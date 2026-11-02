# Comp Plan Simulator

Answer twenty questions about your sales organisation. Get a compensation plan built from
your answers, with the problems in it named, and a simulated quarter running on that plan so
you can see who it pays and who it punishes before it becomes somebody's income.

**Live:** [javierjotah.github.io/comp-plan-simulator](https://javierjotah.github.io/comp-plan-simulator/)

Built by Javier J. Hernandez. [linkedin.com/in/javierjotah](https://www.linkedin.com/in/javierjotah)

---

## What it does

Every company that sells something runs a compensation plan, and very few of them can tell
you why theirs is built the way it is. Ask why the accelerator starts where it starts and
you usually get a shrug.

A comp plan has to follow three rules. **Motivation**, a line a rep can see between the work
they do today and the money that turns up later. **Simplicity**, which means anybody paid by
it can work out their own cheque without help. **Company goals**, which means it pays for the
thing the company says it wants. Most plans break at least one, some break all three, and
usually nobody finds out until the quarter is over.

So this cannot produce a plan without also producing the argument for it. Every plan comes
back with findings: what is right, what is tight, and what will not work, each one naming the
answers behind it so you can change one and watch the plan rebuild.

Then it deals a quarter. Real opportunities with real close timing, a rep who beats their number and
a rep who misses, and five levers you can drag to see what a different quota or a different
cost ceiling would have done. Seven personas, from the AE asking whether they will hit their
number to the CEO asking what the whole thing costs against gross profit.

It also writes the documents you would actually need to roll a plan out: a one-page summary,
a launch deck, a compensation agreement, a capacity model that stress-tests what it costs,
and a finance tracker for attainment and accruals.

## What is interesting about it

**It is deterministic.** No model call at runtime. The frontend reads a flat rules table and
parses it, so the same twenty answers produce the same plan every time, and any figure on the
screen can be traced back to a rule somebody wrote down.

**It is checked harder than it looks.** 26 checks run from one command. The plan arithmetic
is agreed across 41,945 answer sets, 93 fields each. Every sentence the tool can print is
held character for character against a copy document. The workbooks are verified by
recalculating them through LibreOffice rather than by trusting the code that wrote them. The
one-pager is proven to fit one page across 308 plans. Every screen is pixel-compared against
a reference, and the five levers are dragged by a real pointer to prove they still move.

**Every checker was made to fail before its passing result was believed.** A check that has
never failed is a check nobody has tested.

## Running it

```
node check-all.js            every check, about sixteen minutes
node check-all.js --fast     the quick ones, about ninety seconds
node check-all.js --list     what it runs, and in what order
```

Six of the checks need Playwright or a spreadsheet recalculation tool and do not run on
every machine. `check-all` names them when they are skipped.

Nothing is installed to look at the tool itself. Open `mockup/index.html`.

## The files

`CLAUDE.md` for the house rules, `ENGINE-NOTES.md` for the map of what every file is,
`STATUS.md` for where the work stands, `TODO.md` for why each decision went the way it did.
`wizard-copy.md` is every user-facing string in one place, which is what makes holding the
tool to its own copy possible.

## Licence

Not currently licensed for reuse. It is a portfolio piece, and the comp logic in it is the
part I would rather talk through than hand over.
