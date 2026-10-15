# Wafer Simulator Demo

브라우저에서 실행하는 강체 형상/Warpage 기하학적 예시입니다. 기본값은 예시로 명시되어 있으나 공개 전 소유자의 출처 확인이 필요합니다. FEM/CFD 및 실제 장비 성능 검증용 모델이 아닙니다.

## 빌드와 검사

Node.js 20 이상, 외부 패키지 없이 실행:

```
npm run build
npm test
```

현재 작업 환경에는 npm 명령이 없어 아래 Node.js 직접 명령으로 빌드와 테스트를 수행했습니다.

```
node build.mjs
node --test tests.mjs pages.test.mjs
```

검증 결과: 9/9 테스트 통과, app.js/geometry.js 문법 검사 통과, `/wafer-simulator-demo/` 로컬 HTTP 경로 및 모듈 MIME 확인. 실제 브라우저 화면·조작 및 GitHub Pages 실배포 검증은 아직 수행하지 않았습니다.

원본 프로젝트는 변경하지 않았습니다. `src/`는 원본 웹 파일의 사본이고 `docs/`는 공개 사이트입니다. 조건 저장/불러오기는 브라우저의 로컬 파일 기능이며 서버 업로드 기능이 없습니다.

## 승인 후 GitHub Pages 설정

저장소: https://github.com/jammanbo99/wafer-simulator-demo

승인 후 저장소의 기존 내용을 확인하고 변경사항을 통합한 뒤 Push합니다. 현재는 Git 초기화, 원격 연결 및 업로드를 수행하지 않았습니다.

GitHub Settings → Pages → Build and deployment → Deploy from a branch.
배포 브랜치: `main`, 폴더: `/docs`. Save 후 배포 완료를 확인합니다.
예상 주소: https://jammanbo99.github.io/wafer-simulator-demo/

상대 경로로 CSS와 ES modules를 참조하므로 저장소 하위 경로를 지원합니다. 실제 GitHub Pages 환경 검증은 승인 및 배포 이후 가능합니다.

공개 파일과 검토 대상은 `PUBLICATION_REVIEW.md`를 확인하세요.
