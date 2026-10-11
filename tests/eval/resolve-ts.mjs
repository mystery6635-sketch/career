// Node 모듈 해석 훅: TypeScript 소스의 "./x.js" 가져오기를 "./x.ts"로, 확장자 없는 상대 경로를 ".ts"로 이어 준다.
// 평가 스크립트(run-personas.ts)를 별도 도구 없이 `node`로 직접 실행하기 위한 것이다.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context)
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND' && /^\.{1,2}\//.test(specifier)) {
      const candidate = specifier.endsWith('.js') ? `${specifier.slice(0, -3)}.ts` : `${specifier}.ts`
      return nextResolve(candidate, context)
    }
    throw error
  }
}
